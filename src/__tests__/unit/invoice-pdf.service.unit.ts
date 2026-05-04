import {expect, sinon} from '@loopback/testlab';
import chargebee from 'chargebee';
import {ChargeBeeService} from '../../providers/sdk/chargebee/charge-bee.service';
import {StripeService} from '../../providers/sdk/stripe/stripe.service';
import {TInvoicePdf} from '../../types';

// -------------------------------------------------------------------------
// ChargeBee Tests
// -------------------------------------------------------------------------

describe('ChargeBeeService - Invoice PDF Download', () => {
  let service: ChargeBeeService;
  let sandbox: sinon.SinonSandbox;

  /**
   * Helper function to stub ChargeBee API calls.
   * ChargeBee SDK uses a builder pattern: chargebee.resource.action(params).request()
   * So each stub must return an object with a `.request` stub.
   */
  function stubCb(returnValue: object) {
    // NOSONAR
    return {
      request: sinon.stub().resolves(returnValue),
      setIdempotencyKey: sinon.stub().returnsThis(),
      headers: sinon.stub().returnsThis(),
    };
  }

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    // Stub the global chargebee.configure to prevent side effects
    sandbox.stub(chargebee, 'configure');

    // Initialize service with test configuration
    service = new ChargeBeeService({
      site: 'test-site',
      apiKey: 'test-key',
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('getInvoicePdf - Happy Path', () => {
    it('returns PDF URL for a valid invoice', async () => {
      // Stub the chargebee.invoice.pdf() call
      const pdfStub = sandbox.stub(chargebee.invoice, 'pdf').returns(
        stubCb({
          download: {
            download_url: 'https://test.chargebee.com/invoice/inv_123/pdf',
            expires_at: 1735689600, // 2024-12-31
          },
        }),
      );

      // Call the method
      const result: TInvoicePdf = await service.getInvoicePdf('inv_123');

      // Verify the result
      expect(result.invoiceId).to.equal('inv_123');
      expect(result.pdfUrl).to.equal(
        'https://test.chargebee.com/invoice/inv_123/pdf',
      );
      expect(result.expiresAt).to.equal(1735689600);
      expect(result.generatedAt).to.be.type('number');
      expect(result.generatedAt).to.be.greaterThan(0);

      // Verify the API was called correctly
      sinon.assert.calledOnce(pdfStub);
      sinon.assert.calledWith(pdfStub, 'inv_123');
    });

    it('returns PDF URL with current timestamp', async () => {
      sandbox.stub(chargebee.invoice, 'pdf').returns(
        stubCb({
          download: {
            download_url: 'https://test.chargebee.com/invoice/inv_456/pdf',
            expires_at: 1735689600,
          },
        }),
      );

      const before = Math.floor(Date.now() / 1000);
      const result = await service.getInvoicePdf('inv_456');
      const after = Math.floor(Date.now() / 1000);

      expect(result.generatedAt).to.be.greaterThanOrEqual(before);
      expect(result.generatedAt).to.be.lessThanOrEqual(after);
    });
  });

  describe('getInvoicePdf - Error Cases', () => {
    it('throws error when PDF URL is not available', async () => {
      // Stub to return empty download object
      sandbox.stub(chargebee.invoice, 'pdf').returns(
        stubCb({
          download: {},
        }),
      );

      await expect(service.getInvoicePdf('inv_123')).to.be.rejectedWith(
        'PDF URL not available for invoice inv_123. The invoice may be in an invalid state.',
      );
    });

    it('throws error when download object is missing', async () => {
      // Stub to return result without download
      sandbox.stub(chargebee.invoice, 'pdf').returns(stubCb({}));

      await expect(service.getInvoicePdf('inv_123')).to.be.rejectedWith(
        'PDF URL not available for invoice inv_123. The invoice may be in an invalid state.',
      );
    });
  });
});

// -------------------------------------------------------------------------
// Stripe Tests
// -------------------------------------------------------------------------

describe('StripeService - Invoice PDF Download', () => {
  let service: StripeService;
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    // Initialize service with test configuration
    service = new StripeService({secretKey: 'sk_test_123'});
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('getInvoicePdf - Error Cases', () => {
    it('throws error for non-existent invoice', async () => {
      // Mock Stripe error
      sandbox
        .stub(service['stripe'].invoices, 'retrieve')
        .rejects({code: 'resource_missing'});

      await expect(service.getInvoicePdf('in_nonexistent')).to.be.rejectedWith(
        'Invoice not found: in_nonexistent',
      );
    });

    it('throws error for other Stripe errors', async () => {
      // Mock generic Stripe error
      sandbox
        .stub(service['stripe'].invoices, 'retrieve')
        .rejects({code: 'api_error', message: 'Something went wrong'});

      await expect(service.getInvoicePdf('in_error')).to.be.rejected();
    });
  });
});
