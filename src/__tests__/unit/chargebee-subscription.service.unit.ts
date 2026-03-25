import {expect, sinon} from '@loopback/testlab';
import chargebee from 'chargebee';
import {ChargeBeeService} from '../../providers/sdk/chargebee/charge-bee.service';
import {
  CollectionMethod,
  ProrationBehavior,
  RecurringInterval,
  TPrice,
  TProduct,
  TSubscriptionCreate,
  TSubscriptionUpdate,
} from '../../types';

// ---------------------------------------------------------------------------
// Helper — builds a fake Chargebee subscription object
// ---------------------------------------------------------------------------

function makeSubscription(overrides: object = {}) {
  return {
    id: 'sub_cb_001',
    status: 'active',
    customer_id: 'cust_tenant_abc',
    current_term_start: 1700000000,
    current_term_end: 1702592000,
    cancel_at_period_end: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('ChargeBeeService - Subscription Management', () => {
  let service: ChargeBeeService;
  let sandbox: sinon.SinonSandbox;

  /**
   * Stub every chargebee API call so no network requests are made.
   * The chargebee SDK uses a builder pattern: chargebee.resource.action(params).request()
   * so each stub must return an object with a `.request` stub.
   * Cast through `unknown` to satisfy the strict ChargebeeRequest generic type.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function stubCb(returnValue: object): any {
    // NOSONAR
    return {
      request: sinon.stub().resolves(returnValue),
      setIdempotencyKey: sinon.stub().returnsThis(),
      headers: sinon.stub().returnsThis(),
    };
  }

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    // Instantiate with dummy config — chargebee.configure is stubbed below
    sandbox.stub(chargebee, 'configure');
    service = new ChargeBeeService({site: 'test-site', apiKey: 'test-key'});
  });

  afterEach(() => {
    sandbox.restore();
  });

  // -------------------------------------------------------------------------
  // createProduct
  // -------------------------------------------------------------------------

  describe('createProduct', () => {
    it('creates a plan-type Item and returns its ID', async () => {
      const itemStub = sandbox
        .stub(chargebee.item, 'create')
        .returns(stubCb({item: {id: 'enterprise-plan'}}));

      const product: TProduct = {
        name: 'Enterprise Plan',
        description: 'Full-featured tier',
        metadata: {tier: 'enterprise'},
      };

      const result = await service.createProduct(product);

      expect(result).to.equal('enterprise-plan');
      sinon.assert.calledOnce(itemStub);

      const callArg = itemStub.firstCall.args[0];
      // ID is derived from the name
      expect(callArg.id).to.equal('enterprise-plan');
      expect(callArg.type).to.equal('plan');
    });

    it('generates a URL-safe ID from the product name', async () => {
      const itemStub = sandbox
        .stub(chargebee.item, 'create')
        .returns(stubCb({item: {id: 'my-saas-product'}}));

      await service.createProduct({name: 'My SaaS Product!'});

      const callArg = itemStub.firstCall.args[0];
      expect(callArg.id).to.equal('my-saas-product');
    });

    it('uses defaultItemFamilyId from config when provided', async () => {
      const customService = new ChargeBeeService({
        site: 'test-site',
        apiKey: 'test-key',
        defaultItemFamilyId: 'saas-plans',
      });
      const itemStub = sandbox
        .stub(chargebee.item, 'create')
        .returns(stubCb({item: {id: 'enterprise-plan'}}));

      await customService.createProduct({name: 'Enterprise Plan'});

      const callArg = itemStub.firstCall.args[0];
      expect(callArg.item_family_id).to.equal('saas-plans');
    });

    it('falls back to "default" item_family_id when not configured', async () => {
      const itemStub = sandbox
        .stub(chargebee.item, 'create')
        .returns(stubCb({item: {id: 'enterprise-plan'}}));

      await service.createProduct({name: 'Enterprise Plan'});

      const callArg = itemStub.firstCall.args[0];
      expect(callArg.item_family_id).to.equal('default');
    });
  });

  // -------------------------------------------------------------------------
  // createPrice
  // -------------------------------------------------------------------------

  describe('createPrice', () => {
    it('creates an ItemPrice and maps the response to TPrice', async () => {
      const itemPriceResponse = {
        item_price: {
          id: 'enterprise-plan-usd-monthly',
          item_id: 'enterprise-plan',
          currency_code: 'USD',
          price: 4999,
          period_unit: 'month',
          period: 1,
          status: 'active',
        },
      };

      sandbox
        .stub(chargebee.item_price, 'create')
        .returns(stubCb(itemPriceResponse));

      const priceInput: TPrice = {
        currency: 'usd',
        unitAmount: 4999,
        product: 'enterprise-plan',
        recurring: {interval: RecurringInterval.MONTH, intervalCount: 1},
      };

      const result = await service.createPrice(priceInput);

      expect(result.id).to.equal('enterprise-plan-usd-monthly');
      expect(result.currency).to.equal('usd');
      expect(result.unitAmount).to.equal(4999);
      expect(result.product).to.equal('enterprise-plan');
      expect(result.recurring?.interval).to.equal(RecurringInterval.MONTH);
      expect(result.recurring?.intervalCount).to.equal(1);
      expect(result.active).to.be.true();
    });

    it('returns undefined recurring when no period_unit is set', async () => {
      sandbox.stub(chargebee.item_price, 'create').returns(
        stubCb({
          item_price: {
            id: 'setup-fee',
            item_id: 'setup',
            currency_code: 'USD',
            price: 999,
            period_unit: null,
            period: null,
            status: 'active',
          },
        }),
      );

      const result = await service.createPrice({
        currency: 'usd',
        unitAmount: 999,
        product: 'setup',
      });

      expect(result.recurring).to.be.undefined();
    });
  });

  // -------------------------------------------------------------------------
  // createSubscription
  // -------------------------------------------------------------------------

  describe('createSubscription', () => {
    it('creates a subscription and returns its Chargebee ID', async () => {
      const createStub = sandbox
        .stub(chargebee.subscription, 'create_with_items')
        .returns(stubCb({subscription: makeSubscription()}));

      const subscriptionInput: TSubscriptionCreate = {
        customerId: 'cust_tenant_abc',
        priceRefId: 'enterprise-plan-usd-monthly',
        collectionMethod: CollectionMethod.CHARGE_AUTOMATICALLY,
      };

      const result = await service.createSubscription(subscriptionInput);

      expect(result).to.equal('sub_cb_001');
      sinon.assert.calledOnce(createStub);

      const [customerId, params] = createStub.firstCall.args;
      expect(customerId).to.equal('cust_tenant_abc');
      expect(params.subscription_items[0].item_price_id).to.equal(
        'enterprise-plan-usd-monthly',
      );
      expect(params.auto_collection).to.equal('on');
    });

    it('sets auto_collection off and net_term_days for send_invoice', async () => {
      const createStub = sandbox
        .stub(chargebee.subscription, 'create_with_items')
        .returns(stubCb({subscription: makeSubscription()}));

      await service.createSubscription({
        customerId: 'cust_tenant_abc',
        priceRefId: 'enterprise-plan-usd-monthly',
        collectionMethod: CollectionMethod.SEND_INVOICE,
        daysUntilDue: 14,
      });

      const [, params] = createStub.firstCall.args;
      expect(params.auto_collection).to.equal('off');
      expect(params.net_term_days).to.equal(14);
    });
  });

  // -------------------------------------------------------------------------
  // getSubscription
  // -------------------------------------------------------------------------

  describe('getSubscription', () => {
    it('retrieves and maps a subscription to TSubscriptionResult', async () => {
      sandbox
        .stub(chargebee.subscription, 'retrieve')
        .returns(stubCb({subscription: makeSubscription()}));

      const result = await service.getSubscription('sub_cb_001');

      expect(result.id).to.equal('sub_cb_001');
      expect(result.status).to.equal('active');
      expect(result.customerId).to.equal('cust_tenant_abc');
      expect(result.currentPeriodStart).to.equal(1700000000);
      expect(result.currentPeriodEnd).to.equal(1702592000);
      expect(result.cancelAtPeriodEnd).to.be.false();
    });
  });

  // -------------------------------------------------------------------------
  // updateSubscription
  // -------------------------------------------------------------------------

  describe('updateSubscription', () => {
    it('upgrades a subscription to a new item price', async () => {
      const updateStub = sandbox
        .stub(chargebee.subscription, 'update_for_items')
        .returns(stubCb({subscription: makeSubscription()}));

      const updates: TSubscriptionUpdate = {
        priceRefId: 'pro-plan-usd-monthly',
        prorationBehavior: ProrationBehavior.CREATE_PRORATIONS,
      };

      const result = await service.updateSubscription('sub_cb_001', updates);

      expect(result.id).to.equal('sub_cb_001');
      sinon.assert.calledOnce(updateStub);

      const [subId, params] = updateStub.firstCall.args;
      expect(subId).to.equal('sub_cb_001');
      expect(params.subscription_items[0].item_price_id).to.equal(
        'pro-plan-usd-monthly',
      );
    });

    it('disables proration when prorationBehavior is none', async () => {
      const updateStub = sandbox
        .stub(chargebee.subscription, 'update_for_items')
        .returns(stubCb({subscription: makeSubscription()}));

      await service.updateSubscription('sub_cb_001', {
        priceRefId: 'basic-plan-usd',
        prorationBehavior: ProrationBehavior.NONE,
      });

      const [, params] = updateStub.firstCall.args;
      // ProrationBehavior.NONE -> prorate: false
      expect(params!.prorate).to.be.false();
    });
  });

  // -------------------------------------------------------------------------
  // cancelSubscription
  // -------------------------------------------------------------------------

  describe('cancelSubscription', () => {
    it('cancels a subscription immediately with customer_request reason', async () => {
      const cancelStub = sandbox
        .stub(chargebee.subscription, 'cancel_for_items')
        .returns(
          stubCb({subscription: makeSubscription({status: 'cancelled'})}),
        );

      await service.cancelSubscription('sub_cb_001');

      sinon.assert.calledOnce(cancelStub);
      const [subId, params] = cancelStub.firstCall.args as [
        string,
        Record<string, unknown>,
      ];
      expect(subId).to.equal('sub_cb_001');
      expect(params.end_of_term).to.be.false();
      expect(params.cancel_reason_code).to.equal('customer_request');
    });

    it('uses cancelAtEndOfTerm and defaultCancelReasonCode from config when provided', async () => {
      const customService = new ChargeBeeService({
        site: 'test-site',
        apiKey: 'test-key',
        cancelAtEndOfTerm: true,
        defaultCancelReasonCode: 'not_paid',
      });
      const cancelStub = sandbox
        .stub(chargebee.subscription, 'cancel_for_items')
        .returns(
          stubCb({subscription: makeSubscription({status: 'cancelled'})}),
        );

      await customService.cancelSubscription('sub_cb_config');

      const [, params] = cancelStub.firstCall.args as [
        string,
        Record<string, unknown>,
      ];
      expect(params.end_of_term).to.be.true();
      expect(params.cancel_reason_code).to.equal('not_paid');
    });
  });

  // -------------------------------------------------------------------------
  // pauseSubscription
  // -------------------------------------------------------------------------

  describe('pauseSubscription', () => {
    it('pauses a subscription', async () => {
      const pauseStub = sandbox
        .stub(chargebee.subscription, 'pause')
        .returns(stubCb({subscription: makeSubscription({status: 'paused'})}));

      await service.pauseSubscription('sub_cb_001');

      sinon.assert.calledOnceWithExactly(pauseStub, 'sub_cb_001', {});
    });
  });

  // -------------------------------------------------------------------------
  // resumeSubscription
  // -------------------------------------------------------------------------

  describe('resumeSubscription', () => {
    it('resumes a paused subscription', async () => {
      const resumeStub = sandbox
        .stub(chargebee.subscription, 'resume')
        .returns(stubCb({subscription: makeSubscription()}));

      await service.resumeSubscription('sub_cb_001');

      sinon.assert.calledOnceWithExactly(resumeStub, 'sub_cb_001', {});
    });
  });

  // -------------------------------------------------------------------------
  // getInvoicePriceDetails
  // -------------------------------------------------------------------------

  describe('getInvoicePriceDetails', () => {
    it('returns correctly computed price breakdown', async () => {
      sandbox.stub(chargebee.invoice, 'retrieve').returns(
        stubCb({
          invoice: {
            currency_code: 'usd',
            total: 5999,
            tax: 499,
          },
        }),
      );

      const result = await service.getInvoicePriceDetails('inv_cb_001');

      expect(result.currency).to.equal('USD');
      expect(result.totalAmount).to.equal(5999);
      expect(result.taxAmount).to.equal(499);
      expect(result.amountExcludingTax).to.equal(5500);
    });

    it('handles zero tax gracefully', async () => {
      sandbox.stub(chargebee.invoice, 'retrieve').returns(
        stubCb({
          invoice: {currency_code: 'eur', total: 2000, tax: 0},
        }),
      );

      const result = await service.getInvoicePriceDetails('inv_cb_zero_tax');

      expect(result.taxAmount).to.equal(0);
      expect(result.amountExcludingTax).to.equal(2000);
    });
  });

  // -------------------------------------------------------------------------
  // sendPaymentLink
  // -------------------------------------------------------------------------

  describe('sendPaymentLink', () => {
    it('calls chargebee.invoice.collect_payment to trigger payment link delivery', async () => {
      const collectStub = sandbox
        .stub(chargebee.invoice, 'collect_payment')
        .returns(stubCb({invoice: {id: 'inv_cb_001'}}));

      await service.sendPaymentLink('inv_cb_001');

      sinon.assert.calledOnce(collectStub);
      const [invoiceId] = collectStub.firstCall.args;
      expect(invoiceId).to.equal('inv_cb_001');
    });
  });

  // -------------------------------------------------------------------------
  // checkProductExists
  // -------------------------------------------------------------------------

  describe('checkProductExists', () => {
    it('returns true when the item is active', async () => {
      sandbox
        .stub(chargebee.item, 'retrieve')
        .returns(stubCb({item: {id: 'enterprise-plan', status: 'active'}}));

      const result = await service.checkProductExists('enterprise-plan');

      expect(result).to.be.true();
    });

    it('returns false when the item is archived', async () => {
      sandbox
        .stub(chargebee.item, 'retrieve')
        .returns(stubCb({item: {id: 'old-plan', status: 'archived'}}));

      const result = await service.checkProductExists('old-plan');

      expect(result).to.be.false();
    });

    it('returns false when Chargebee signals resource_not_found', async () => {
      sandbox
        .stub(chargebee.item, 'retrieve')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .returns({
          request: sinon.stub().rejects({api_error_code: 'resource_not_found'}),
          setIdempotencyKey: sinon.stub().returnsThis(),
          headers: sinon.stub().returnsThis(),
        } as any); // NOSONAR

      const result = await service.checkProductExists('missing-plan');

      expect(result).to.be.false();
    });

    it('re-throws unexpected errors from Chargebee', async () => {
      sandbox
        .stub(chargebee.item, 'retrieve')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .returns({
          request: sinon.stub().rejects(new Error('Network timeout')),
          setIdempotencyKey: sinon.stub().returnsThis(),
          headers: sinon.stub().returnsThis(),
        } as any); // NOSONAR

      await expect(service.checkProductExists('flaky-plan')).to.be.rejectedWith(
        Error,
      );
    });
  });
});
