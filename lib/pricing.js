import { CurrencyCode } from '../constants/enums';

/**
 * @param {Object} params
 * @param {import('@prisma/client/runtime/client').Decimal} params.price
 */
export function getSubtotalBreakdown({ qty, price, currencyCode, discount, upgradeCouponDiscount }) {
  let result = {};
  let subtotal = price.times(qty);
  
  result.amount = subtotal;

  if (discount) {
    let discountAmount = subtotal.times(discount).dividedBy(100);
    if (currencyCode === CurrencyCode.IDR) discountAmount = discountAmount.round();
    if (currencyCode === CurrencyCode.USD) discountAmount = discountAmount.toDecimalPlaces(2);

    result.discountAmount = discountAmount;
    subtotal = subtotal.minus(discountAmount);
  }

  if (upgradeCouponDiscount) {
    let upgradeCouponPrice = subtotal.times(upgradeCouponDiscount).dividedBy(100);
    if (currencyCode === CurrencyCode.IDR) upgradeCouponPrice = upgradeCouponPrice.round();
    if (currencyCode === CurrencyCode.USD) upgradeCouponPrice = upgradeCouponPrice.toDecimalPlaces(2);

    result.upgradeCouponAmount = upgradeCouponPrice;
    subtotal = subtotal.minus(upgradeCouponPrice);
  }

  result.subtotal = subtotal;
  return result;
}

export function getTotalAmount(items) {
  return items.reduce((total, item) => {
    const { subtotal } = getSubtotalBreakdown({
      qty: item.qty,
      price: item.productPrice,
      currencyCode: item.productCurrencyCode,
      discount: item.productDiscount,
      upgradeCouponDiscount: item.productUpgradeCouponDiscount,
    });
    return subtotal.plus(total);
  }, 0);
}
