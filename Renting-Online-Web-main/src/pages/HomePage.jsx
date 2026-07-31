import Header from '../components/header/Header';
import Footer from '../components/footer/Footer';
import ProductList from '../components/product_list/ProductList';
import CommentList from '../components/comments/CommentList';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const HomePage = () => {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState({
        recommend: 'horizontal',
        recent: 'horizontal'
    });

    const [productList, setProductList] = useState([]);
    // Get search params from URL
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('search') || '';

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch('api/products/', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    console.log('PRODUCT DATA LIST:', data);
                    setProductList(data.data.products);
                } else {
                    console.error('Failed to fetch products. Status:', response.status);
                }
            } catch (error) {
                console.error('Error fetching products:', error);
            }
        }

        fetchProducts();
    }, []);

    const filteredProducts = productList.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const changeMode = (viewName) => {
        setViewMode(prev => ({
            ...prev,
            [viewName]: prev[viewName] === 'horizontal' ? 'vertical' : 'horizontal'
        }))
    }

    return (
        <div>
            <Header />
            <div className="flex justify-center items-center">
                <div className="flex flex-col md:flex-row w-full max-w-6xl mx-2 sm:mx-4 md:mx-10 my-5 rounded-3xl bg-gray shadow-[4px_4px_3px_rgba(0,0,0,0.5)] ring-1 ring-gray-300">
                    <div className="flex flex-col flex-1 pt-8 md:pt-20 justify-start items-center">
                        <button className="h-16 w-40 md:h-20 md:w-56 relative mx-4 md:mx-20 my-4 px-2 py-2 bg-[#f4efef] rounded-2xl font-extrabold text-gray-900 
                            shadow-[-10px_8px_0_#333] transition-all duration-150 
                            hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[-5px_3px_0_#333] text-2xl md:text-4xl"
                            onClick={() => navigate('/product')}>
                            BORROWIT
                        </button>
                        <h1 className="mt-3 mb-6 md:mt-5 md:mb-10 px-4 md:px-10 py-2 text-xl md:text-3xl font-black text-center">
                            The platform that let you rent everything!
                        </h1>
                        <div className="flex justify-center items-center w-full mb-10">
                            <button className="text-base md:text-xl text-white font-bold w-3/4 md:w-1/2 pt-2 pb-2 rounded-lg border-4 border-transparent bg-black
                                hover:bg-white hover:border-4 hover:border-black hover:text-black transition-all duration-150"
                                onClick={() => navigate('/product')}>
                                Find Product Now
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 flex justify-center items-center mb-6 md:mb-20">
                        <img
                            className="w-full max-w-xs md:max-w-md h-48 md:h-3/4 object-cover rounded-3xl mr-0 md:mr-5"
                            src="https://img.freepik.com/premium-vector/e-commerce-web-design-concept-with-people-characters_9209-4610.jpg"
                            alt="intro image"
                        />
                    </div>
                </div>
            </div>

            <div className='w-full flex flex-col content-center my-10'>
                <h1 className='font-black text-2xl md:text-4xl mb-10 text-center'>Newest Product</h1>
                <div className='ml-10 mr-10'>
                    {filteredProducts.length === 0 ? (
                        <p className='text-center text-gray-500'>No available products found.</p>
                    ) : 
                        <ProductList View={viewMode.recommend} Products={filteredProducts} modeRate={false}/>
                    }
                </div>
                <div className='flex justify-center content-center mt-10'>
                    <button className='w-36 p-2 flex justify-center content-center
                            font-medium text-sm md:text-base text-black bg-white 
                            rounded-full border-2 border-gray-200
                            hover:scale-105 transition-transform duration-300 ease-in-out'
                            onClick={() => changeMode('recommend')}>
                        {viewMode.recommend === 'horizontal' ? 'View All' : 'View Less'}
                    </button>
                </div>
            </div>

            <div className='m-20 border border-t-gray-200'></div>
            
            <div className='w-full flex flex-col content-center my-10'>
                <h1 className='font-black text-2xl md:text-4xl mb-10 text-center'>Top-Selling Product</h1>
                <div className='ml-10 mr-10'>
                    {filteredProducts.length === 0 ? (
                        <p className='text-center text-gray-500'>No available products found.</p>
                    ) : 
                        <ProductList View={viewMode.recent} Products={filteredProducts} modeRate={false}/>
                    }
                </div>
                <div className='flex justify-center content-center mt-10'>
                    <button className='w-36 p-2 flex justify-center content-center
                            font-medium text-sm md:text-base text-black bg-white 
                            rounded-full border-2 border-gray-200
                            hover:scale-105 transition-transform duration-300 ease-in-out'
                            onClick={() => changeMode('recent')}>
                        {viewMode.recent === 'horizontal' ? 'View All' : 'View Less'}
                    </button>
                </div>
            </div>
            {/* <div className='m-20 border border-t-gray-200'></div> */}

            {/* <h2 className="pl-9 md:pl-14 text-2xl md:text-4xl font-black mb-6">OUR HAPPY CUSTOMERS</h2>
            <CommentList comments={comments} totalReviews={comments.length} /> */}

            <Footer />
        </div>
    )
}

export default HomePage;