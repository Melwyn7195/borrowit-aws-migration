function calCulateSalePrice(originalPrice, discountPercentage) {
    if (originalPrice == null || discountPercentage == null) {
        return null;
    }
    const discountAmount = (originalPrice * discountPercentage) / 100;
    const finalPrice = originalPrice - discountAmount;
    return parseFloat(finalPrice.toFixed(2));
}

export default calCulateSalePrice;