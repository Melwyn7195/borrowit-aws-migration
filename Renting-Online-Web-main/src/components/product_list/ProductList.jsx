import ProductCard from "./ProductCard"
import { useState } from "react"

function ProductList({ View = "horizontal", Products = [], modeRate = false }) {
    const getView = (view) =>{
        switch (view.toLowerCase()) {
            case "horizontal":
                return 'h-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 justify-evenly';
            case "vertical":
                return 'h-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 justify-evenly';
        }
    }
    const [page, setPage] = useState(1);
    const itemQuantity = View === "horizontal" ? 4 : 15;

    const startIdx = (page - 1) * itemQuantity;
    const endIdx = startIdx + itemQuantity;
    const visibleProducts = Products.slice(startIdx, endIdx);

    return (
        <>
            <div className={getView(View)}> 
                {visibleProducts.map((product, i) => (
                    <ProductCard key={startIdx + i} product={product} modeRate={modeRate} view={View}/>
                ))}
            </div>
        </>
    )
}
export default ProductList