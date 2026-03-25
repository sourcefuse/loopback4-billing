import {expect, sinon} from '@loopback/testlab';
import {StripeService} from '../../providers/sdk/stripe/stripe.service';
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
// Helper types used inside tests only
// ---------------------------------------------------------------------------

interface StubStripeSubscriptionItem {
  id: string;
}

interface StubStripeSubscription {
  id: string;
  status: string;
  customer: string;
  cancel_at_period_end: boolean;
  current_period_start: number;
  current_period_end: number;
  items: {data: StubStripeSubscriptionItem[]};
}

interface StubStripeInvoice {
  id: string;
  status: string;
}

interface StubStripeInvoiceDetail {
  currency: string;
  total: number;
  total_tax_amounts: {amount: number}[];
}

interface StubStripePrice {
  id: string;
  currency: string;
  unit_amount: number | null;
  product: string;
  recurring: {interval: string; interval_count: number} | null;
  metadata: Record<string, string>;
  active: boolean;
}

interface StubbedStripe {
  products: {
    create: sinon.SinonStub;
    retrieve: sinon.SinonStub;
  };
  prices: {
    create: sinon.SinonStub;
  };
  subscriptions: {
    create: sinon.SinonStub;
    retrieve: sinon.SinonStub;
    update: sinon.SinonStub;
    cancel: sinon.SinonStub;
  };
  invoices: {
    retrieve: sinon.SinonStub;
    list: sinon.SinonStub;
    sendInvoice: sinon.SinonStub;
    voidInvoice: sinon.SinonStub;
    finalizeInvoice: sinon.SinonStub;
  };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('StripeService - Subscription Management', () => {
  let service: StripeService;
  let sandbox: sinon.SinonSandbox;
  let stripeStub: StubbedStripe;

  /**
   * Create a fresh StripeService with all Stripe API calls stubbed out so no
   * real network requests are made.
   */
  beforeEach(() => {
    sandbox = sinon.createSandbox();

    // Instantiate with a dummy key (never reaches the network)
    service = new StripeService({secretKey: 'sk_test_dummy'});

    stripeStub = {
      products: {
        create: sandbox.stub(),
        retrieve: sandbox.stub(),
      },
      prices: {
        create: sandbox.stub(),
      },
      subscriptions: {
        create: sandbox.stub(),
        retrieve: sandbox.stub(),
        update: sandbox.stub(),
        cancel: sandbox.stub(),
      },
      invoices: {
        retrieve: sandbox.stub(),
        list: sandbox.stub(),
        sendInvoice: sandbox.stub(),
        voidInvoice: sandbox.stub(),
        finalizeInvoice: sandbox.stub(),
      },
    };

    // Override the protected stripe field so every SDK call hits a stub
    (service as unknown as {stripe: StubbedStripe}).stripe = stripeStub;
  });

  afterEach(() => {
    sandbox.restore();
  });

  // -------------------------------------------------------------------------
  // createProduct
  // -------------------------------------------------------------------------

  describe('createProduct', () => {
    it('creates a product and returns its Stripe ID', async () => {
      const product: TProduct = {
        name: 'Enterprise Plan',
        description: 'Full-featured enterprise subscription',
        metadata: {tier: 'enterprise'},
      };

      stripeStub.products.create.resolves({id: 'prod_enterprise_123'});

      const result = await service.createProduct(product);

      expect(result).to.equal('prod_enterprise_123');
      sinon.assert.calledOnceWithExactly(stripeStub.products.create, {
        name: product.name,
        description: product.description,
        metadata: product.metadata,
      });
    });
  });

  // -------------------------------------------------------------------------
  // createPrice
  // -------------------------------------------------------------------------

  describe('createPrice', () => {
    it('creates a recurring price and maps the response to TPrice', async () => {
      const priceInput: TPrice = {
        currency: 'usd',
        unitAmount: 4999,
        product: 'prod_enterprise_123',
        recurring: {
          interval: RecurringInterval.MONTH,
          intervalCount: 1,
        },
        metadata: {plan: 'monthly'},
      };

      const stripeResponse: StubStripePrice = {
        id: 'price_monthly_456',
        currency: 'usd',
        unit_amount: 4999,
        product: 'prod_enterprise_123',
        recurring: {interval: 'month', interval_count: 1},
        metadata: {plan: 'monthly'},
        active: true,
      };

      stripeStub.prices.create.resolves(stripeResponse);

      const result = await service.createPrice(priceInput);

      expect(result.id).to.equal('price_monthly_456');
      expect(result.currency).to.equal('usd');
      expect(result.unitAmount).to.equal(4999);
      expect(result.product).to.equal('prod_enterprise_123');
      expect(result.recurring?.interval).to.equal(RecurringInterval.MONTH);
      expect(result.recurring?.intervalCount).to.equal(1);
      expect(result.active).to.be.true();
    });

    it('handles a one-time price (no recurring field)', async () => {
      const priceInput: TPrice = {
        currency: 'usd',
        unitAmount: 999,
        product: 'prod_setup_fee',
      };

      const stripeResponse: StubStripePrice = {
        id: 'price_setup_789',
        currency: 'usd',
        unit_amount: 999,
        product: 'prod_setup_fee',
        recurring: null,
        metadata: {},
        active: true,
      };

      stripeStub.prices.create.resolves(stripeResponse);

      const result = await service.createPrice(priceInput);

      expect(result.recurring).to.be.undefined();
    });
  });

  // -------------------------------------------------------------------------
  // createSubscription
  // -------------------------------------------------------------------------

  describe('createSubscription', () => {
    it('creates a subscription and returns its Stripe ID', async () => {
      const subscriptionInput: TSubscriptionCreate = {
        customerId: 'cus_tenant_abc',
        priceRefId: 'price_monthly_456',
        collectionMethod: CollectionMethod.CHARGE_AUTOMATICALLY,
      };

      stripeStub.subscriptions.create.resolves({id: 'sub_new_001'});

      const result = await service.createSubscription(subscriptionInput);

      expect(result).to.equal('sub_new_001');
      sinon.assert.calledOnce(stripeStub.subscriptions.create);

      const callArg = stripeStub.subscriptions.create.firstCall.args[0];
      expect(callArg.customer).to.equal('cus_tenant_abc');
      expect(callArg.payment_behavior).to.equal('default_incomplete');
    });

    it('passes daysUntilDue when collection method is send_invoice', async () => {
      const subscriptionInput: TSubscriptionCreate = {
        customerId: 'cus_tenant_xyz',
        priceRefId: 'price_monthly_456',
        collectionMethod: CollectionMethod.SEND_INVOICE,
        daysUntilDue: 30,
      };

      stripeStub.subscriptions.create.resolves({id: 'sub_invoice_002'});

      await service.createSubscription(subscriptionInput);

      const callArg = stripeStub.subscriptions.create.firstCall.args[0];
      expect(callArg.days_until_due).to.equal(30);
      expect(callArg.collection_method).to.equal(CollectionMethod.SEND_INVOICE);
    });

    it('uses defaultPaymentBehavior from StripeConfig when provided', async () => {
      // Create a separate service instance with a custom payment behavior so
      // callers are not forced to use the SCA-default 'default_incomplete'.
      const customService = new StripeService({
        secretKey: 'sk_test_dummy',
        defaultPaymentBehavior: 'allow_incomplete',
      });
      (customService as unknown as {stripe: StubbedStripe}).stripe = stripeStub;

      stripeStub.subscriptions.create.resolves({id: 'sub_custom_003'});

      await customService.createSubscription({
        customerId: 'cus_custom',
        priceRefId: 'price_abc',
        collectionMethod: CollectionMethod.CHARGE_AUTOMATICALLY,
      });

      const callArg = stripeStub.subscriptions.create.firstCall.args[0];
      expect(callArg.payment_behavior).to.equal('allow_incomplete');
    });

    it('falls back to default_incomplete when defaultPaymentBehavior is not configured', async () => {
      stripeStub.subscriptions.create.resolves({id: 'sub_default_004'});

      await service.createSubscription({
        customerId: 'cus_fallback',
        priceRefId: 'price_fallback',
        collectionMethod: CollectionMethod.CHARGE_AUTOMATICALLY,
      });

      const callArg = stripeStub.subscriptions.create.firstCall.args[0];
      expect(callArg.payment_behavior).to.equal('default_incomplete');
    });
  });

  // -------------------------------------------------------------------------
  // getSubscription
  // -------------------------------------------------------------------------

  describe('getSubscription', () => {
    it('retrieves and maps a subscription to TSubscriptionResult', async () => {
      const stubSub: StubStripeSubscription = {
        id: 'sub_active_001',
        status: 'active',
        customer: 'cus_tenant_abc',
        cancel_at_period_end: false,
        current_period_start: 1700000000,
        current_period_end: 1702592000,
        items: {data: [{id: 'si_001'}]},
      };

      stripeStub.subscriptions.retrieve.resolves(stubSub);

      const result = await service.getSubscription('sub_active_001');

      expect(result.id).to.equal('sub_active_001');
      expect(result.status).to.equal('active');
      expect(result.customerId).to.equal('cus_tenant_abc');
      expect(result.currentPeriodStart).to.equal(1700000000);
      expect(result.currentPeriodEnd).to.equal(1702592000);
      expect(result.cancelAtPeriodEnd).to.be.false();
    });
  });

  // -------------------------------------------------------------------------
  // updateSubscription
  // -------------------------------------------------------------------------

  describe('updateSubscription', () => {
    it('updates an active subscription in place with proration', async () => {
      const activeSub: StubStripeSubscription = {
        id: 'sub_active_001',
        status: 'active',
        customer: 'cus_tenant_abc',
        cancel_at_period_end: false,
        current_period_start: 1700000000,
        current_period_end: 1702592000,
        items: {data: [{id: 'si_item_001'}]},
      };
      const updatedSub: StubStripeSubscription = {...activeSub};

      stripeStub.subscriptions.retrieve.resolves(activeSub);
      stripeStub.subscriptions.update.resolves(updatedSub);

      const updates: TSubscriptionUpdate = {
        priceRefId: 'price_pro_999',
        prorationBehavior: ProrationBehavior.CREATE_PRORATIONS,
      };

      const result = await service.updateSubscription(
        'sub_active_001',
        updates,
      );

      expect(result.id).to.equal('sub_active_001');
      expect(result.status).to.equal('active');

      // Verify stripe.subscriptions.cancel was NOT called (active path)
      sinon.assert.notCalled(stripeStub.subscriptions.cancel);
      sinon.assert.calledOnce(stripeStub.subscriptions.update);

      const updateArg = stripeStub.subscriptions.update.firstCall.args[1];
      expect(updateArg.proration_behavior).to.equal(
        ProrationBehavior.CREATE_PRORATIONS,
      );
      expect(updateArg.items[0].price).to.equal('price_pro_999');
    });

    it('cancels an incomplete subscription and creates a replacement', async () => {
      const incompleteSub: StubStripeSubscription = {
        id: 'sub_incomplete_007',
        status: 'incomplete',
        customer: 'cus_tenant_abc',
        cancel_at_period_end: false,
        current_period_start: 0,
        current_period_end: 0,
        items: {data: [{id: 'si_item_007'}]},
      };

      stripeStub.subscriptions.retrieve.resolves(incompleteSub);
      stripeStub.subscriptions.cancel.resolves({});
      stripeStub.subscriptions.create.resolves({id: 'sub_replacement_008'});

      const updates: TSubscriptionUpdate = {priceRefId: 'price_pro_999'};

      const result = await service.updateSubscription(
        'sub_incomplete_007',
        updates,
      );

      // a new subscription ID should be returned
      expect(result.id).to.equal('sub_replacement_008');
      expect(result.status).to.equal('incomplete');

      sinon.assert.calledOnce(stripeStub.subscriptions.cancel);
      sinon.assert.calledOnce(stripeStub.subscriptions.create);
    });
  });

  // -------------------------------------------------------------------------
  // cancelSubscription
  // -------------------------------------------------------------------------

  describe('cancelSubscription', () => {
    it('cancels the subscription and voids open invoices', async () => {
      const openInvoice: StubStripeInvoice = {
        id: 'in_open_001',
        status: 'open',
      };

      stripeStub.subscriptions.cancel.resolves({});
      stripeStub.invoices.list.resolves({data: [openInvoice]});
      stripeStub.invoices.voidInvoice.resolves({});

      await service.cancelSubscription('sub_active_001');

      sinon.assert.calledOnce(stripeStub.subscriptions.cancel);
      sinon.assert.calledOnceWithExactly(
        stripeStub.invoices.voidInvoice,
        'in_open_001',
      );
      sinon.assert.notCalled(stripeStub.invoices.finalizeInvoice);
    });

    it('finalizes then voids draft invoices on cancellation', async () => {
      const draftInvoice: StubStripeInvoice = {
        id: 'in_draft_002',
        status: 'draft',
      };

      stripeStub.subscriptions.cancel.resolves({});
      stripeStub.invoices.list.resolves({data: [draftInvoice]});
      stripeStub.invoices.finalizeInvoice.resolves({});
      stripeStub.invoices.voidInvoice.resolves({});

      await service.cancelSubscription('sub_active_001');

      sinon.assert.calledOnceWithExactly(
        stripeStub.invoices.finalizeInvoice,
        'in_draft_002',
      );
      sinon.assert.calledOnceWithExactly(
        stripeStub.invoices.voidInvoice,
        'in_draft_002',
      );
    });

    it('takes no invoice action for already-paid invoices', async () => {
      const paidInvoice: StubStripeInvoice = {
        id: 'in_paid_003',
        status: 'paid',
      };

      stripeStub.subscriptions.cancel.resolves({});
      stripeStub.invoices.list.resolves({data: [paidInvoice]});

      await service.cancelSubscription('sub_active_001');

      sinon.assert.notCalled(stripeStub.invoices.voidInvoice);
      sinon.assert.notCalled(stripeStub.invoices.finalizeInvoice);
    });
  });

  // -------------------------------------------------------------------------
  // pauseSubscription
  // -------------------------------------------------------------------------

  describe('pauseSubscription', () => {
    it('pauses a subscription by setting mark_uncollectible behavior', async () => {
      stripeStub.subscriptions.update.resolves({});

      await service.pauseSubscription('sub_active_001');

      sinon.assert.calledOnce(stripeStub.subscriptions.update);
      const updateArg = stripeStub.subscriptions.update.firstCall.args[1];
      expect(updateArg.pause_collection?.behavior).to.equal(
        'mark_uncollectible',
      );
    });
  });

  // -------------------------------------------------------------------------
  // resumeSubscription
  // -------------------------------------------------------------------------

  describe('resumeSubscription', () => {
    it('resumes a paused subscription by clearing pause_collection', async () => {
      stripeStub.subscriptions.update.resolves({});

      await service.resumeSubscription('sub_paused_001');

      sinon.assert.calledOnce(stripeStub.subscriptions.update);
      const callArg = stripeStub.subscriptions.update.firstCall.args[0];
      expect(callArg).to.equal('sub_paused_001');
    });
  });

  // -------------------------------------------------------------------------
  // getInvoicePriceDetails
  // -------------------------------------------------------------------------

  describe('getInvoicePriceDetails', () => {
    it('returns a correctly computed invoice price breakdown', async () => {
      const fakeInvoice: StubStripeInvoiceDetail = {
        currency: 'usd',
        total: 5999,
        total_tax_amounts: [{amount: 500}, {amount: 299}],
      };

      stripeStub.invoices.retrieve.resolves(fakeInvoice);

      const result = await service.getInvoicePriceDetails('in_123');

      expect(result.currency).to.equal('USD');
      expect(result.totalAmount).to.equal(5999);
      expect(result.taxAmount).to.equal(799); // 500 + 299
      expect(result.amountExcludingTax).to.equal(5200); // 5999 - 799
    });

    it('returns zero tax when total_tax_amounts is empty', async () => {
      stripeStub.invoices.retrieve.resolves({
        currency: 'eur',
        total: 2000,
        total_tax_amounts: [],
      });

      const result = await service.getInvoicePriceDetails('in_no_tax');

      expect(result.taxAmount).to.equal(0);
      expect(result.amountExcludingTax).to.equal(2000);
    });
  });

  // -------------------------------------------------------------------------
  // sendPaymentLink
  // -------------------------------------------------------------------------

  describe('sendPaymentLink', () => {
    it('calls stripe.invoices.sendInvoice with the correct invoice ID', async () => {
      // Stub retrieve to return a send_invoice, finalized (open) invoice
      stripeStub.invoices.retrieve.resolves({
        id: 'in_link_001',
        status: 'open',
        collection_method: 'send_invoice',
      });
      stripeStub.invoices.sendInvoice.resolves({});

      await service.sendPaymentLink('in_link_001');

      sinon.assert.calledOnceWithExactly(
        stripeStub.invoices.sendInvoice,
        'in_link_001',
      );
    });

    it('finalizes a draft send_invoice before sending', async () => {
      stripeStub.invoices.retrieve.resolves({
        id: 'in_draft_001',
        status: 'draft',
        collection_method: 'send_invoice',
      });
      stripeStub.invoices.finalizeInvoice.resolves({});
      stripeStub.invoices.sendInvoice.resolves({});

      await service.sendPaymentLink('in_draft_001');

      sinon.assert.calledOnceWithExactly(
        stripeStub.invoices.finalizeInvoice,
        'in_draft_001',
      );
      sinon.assert.calledOnceWithExactly(
        stripeStub.invoices.sendInvoice,
        'in_draft_001',
      );
    });

    it('skips sendInvoice for charge_automatically invoices', async () => {
      stripeStub.invoices.retrieve.resolves({
        id: 'in_auto_001',
        status: 'open',
        collection_method: 'charge_automatically',
      });

      await service.sendPaymentLink('in_auto_001');

      sinon.assert.notCalled(stripeStub.invoices.sendInvoice);
    });

    it('finalizes draft charge_automatically invoice without sending', async () => {
      stripeStub.invoices.retrieve.resolves({
        id: 'in_auto_draft_001',
        status: 'draft',
        collection_method: 'charge_automatically',
      });
      stripeStub.invoices.finalizeInvoice.resolves({});

      await service.sendPaymentLink('in_auto_draft_001');

      sinon.assert.calledOnceWithExactly(
        stripeStub.invoices.finalizeInvoice,
        'in_auto_draft_001',
      );
      sinon.assert.notCalled(stripeStub.invoices.sendInvoice);
    });
  });

  // -------------------------------------------------------------------------
  // checkProductExists
  // -------------------------------------------------------------------------

  describe('checkProductExists', () => {
    it('returns true when the product exists and is active', async () => {
      stripeStub.products.retrieve.resolves({active: true});

      const result = await service.checkProductExists('prod_active_001');

      expect(result).to.be.true();
    });

    it('returns false when the product is archived (active: false)', async () => {
      stripeStub.products.retrieve.resolves({active: false});

      const result = await service.checkProductExists('prod_archived_002');

      expect(result).to.be.false();
    });

    it('returns false when Stripe signals resource_missing', async () => {
      const notFoundError = Object.assign(new Error('No such product'), {
        code: 'resource_missing',
      });
      stripeStub.products.retrieve.rejects(notFoundError);

      const result = await service.checkProductExists('prod_gone_003');

      expect(result).to.be.false();
    });

    it('re-throws unexpected errors from Stripe', async () => {
      const networkError = new Error('Network failure');
      stripeStub.products.retrieve.rejects(networkError);

      await expect(
        service.checkProductExists('prod_error_004'),
      ).to.be.rejectedWith('Network failure');
    });
  });
});
