export const CurrencyCode = Object.freeze({
  IDR: 'IDR',
  USD: 'USD',
});

export const PriceType = Object.freeze({
  PAID: 'paid',
  FREE: 'free',
});

export const Language = Object.freeze({
  ID: 'id',
  EN: 'en',
});

export const TransactionStatus = Object.freeze({
  PENDING: 'pending',
  PAID: 'paid',
  CANCELLED: 'cancelled',
  REFUND: 'refund',
});

export const ShareMethod = Object.freeze({
  DOWNLOAD_LINK: 'download_link',
  DRIVE_SHARE: 'drive_share',
  MANUAL_REQUIRED: 'manual_required',
});

export const AdminRole = Object.freeze({
  /**
   * Owner has full access to the system.
   * This role alone holds the following exclusive privileges:
   * - Managing admin accounts (create, update, delete)
   * - Managing all products, regardless of assigned admin
   * - Reassigning product responsibility to other admins
   *
   * Note: Admins are not necessarily the "owners" of a product,
   * but they are always the ones responsible for it—especially in contexts like checkout or customer support.
   */
  owner: 'owner',

  /**
   * Staff can perform all operational tasks within the system,
   * except for the exclusive privileges reserved for Owner.
   * In other words, Staff can manage their own products and handle most CMS functions,
   * but cannot manage admin accounts or reassign product responsibility.
   */
  staff: 'staff',
});
