import Header from '../components/header/Header';
import Footer from '../components/footer/Footer';
import { useState, useEffect, Fragment } from 'react';
import { useNavigate } from "react-router-dom";

import { BsTag } from 'react-icons/bs';
import { HiOutlineArrowRight } from 'react-icons/hi';

const GUEST_CART_KEY = "guestCart";
const USER_CART_KEY = "userCart"

const CartPage = () => {
    const navigate = useNavigate();
    const [itemList, setItemList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isGuest, setIsGuest] = useState(false);

    const processCartItems = (items) => {
        if (!items || !Array.isArray(items)) return [];
        return items.map(item => {
            // Pull 'rentalDays' (the old key) out of the item
            const { rentalDays, ...restOfItem } = item;
            
            return {
                ...restOfItem, // The item without 'rentalDays'
                quantity: 1, // Always 1 since each product is unique
                // Standardize the key to 'rent_time':
                rent_time: item.rent_time ?? rentalDays ?? 1
            };
        });
    };

    const syncCartToDb = async (items) => {
        console.log("Updating cart items list...");
        try {
            const res = await fetch('/api/cart/items', { 
                method: 'PUT', 
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newList: items }) 
            });

            if (!res.ok) {
                throw new Error("Server failed to update cart items.");
            }
            
            console.log("Updated cart items successfully in the database.");

        } catch (err) {
            console.error(err);
            
            setError("Cannot save cart. Please try again later.");
        }
    };

    // Main data fetching effect
    useEffect(() => {
        const fetchCartData = async () => {
            setIsLoading(true); 
            setError(null); 

            try {
                // 1. Check user session
                const sessionRes = await fetch('/api/users/me', {
                    credentials: 'include',
                    cache: 'no-cache'
                });

                if (sessionRes.ok) {
                    // --- USER IS LOGGED IN ---
                    setIsGuest(false); // Set guest state
                    console.log("User is logged in. Fetching cart from API...");

                    const cartCheckRes = await fetch('/api/cart/my-cart', {
                        credentials: 'include',
                        cache: 'no-cache'
                    });

                    if (!cartCheckRes.ok) {
                        // This error means the backend failed to find or create a cart
                        throw new Error(`Failed to check/create cart: ${cartCheckRes.status}`);
                    }
                    
                    console.log("Cart OK. Fetching cart items...");
                    try {
                        const res = await fetch('api/cart/items', {
                            credentials: 'include',
                            cache: 'no-cache'
                        });

                        if (!res.ok) {
                            throw new Error(`HTTP error! status: ${res.status}`);
                        }

                        const response = await res.json();
                        const cartContent = response.data;
                        console.log(cartContent)
                        
                        if (cartContent && cartContent.length === 0) {
                            const cartString = localStorage.getItem(GUEST_CART_KEY);
                            const cart = JSON.parse(cartString)
                            if (cart == null) {
                                setItemList([]);
                                return;
                            }
                            setItemList(cart.items)
                            const cartToSave = {
                                "items" : itemList,
                                "total_cost" : calculateTotalPrice()
                            }
                            localStorage.setItem(USER_CART_KEY, JSON.stringify(cartToSave))
                        } else if (cartContent && cartContent.length > 0) {
                            setItemList(processCartItems(cartContent));
                        }

                        localStorage.removeItem(GUEST_CART_KEY);

                    } catch (cartError) {
                        console.error("Failed to fetch API cart:", cartError);
                        setError(cartError.message);
                    }
                
                } else {
                    // --- USER IS A GUEST ---
                    setIsGuest(true); // Set guest state
                    console.log("User is a guest. Loading cart from localStorage...");
                    
                    const cartString = localStorage.getItem(GUEST_CART_KEY);
                    if (cartString) {
                        const cart = JSON.parse(cartString);
                        if (cart.items) {
                            // FIX: Process items *before* setting state
                            setItemList(processCartItems(cart.items));
                        }
                    }
                }

            } catch (sessionError) {
                // This catches errors from the session check itself
                console.error("Failed to check session:", sessionError);
                setError(sessionError.message);
                setIsGuest(true); // Assume guest if session check fails
            } finally {
                setIsLoading(false);
            }
        };

        fetchCartData();
    }, []);
    
    const countItems = itemList.length;

    // Effect to *save* the cart to localStorage *only if* the user is a guest
    useEffect(() => {
        const saveTimer = setTimeout(() => {
            if (isLoading) return; 

            const cartToSave = {
                "items" : itemList,
                "total_cost" : calculateTotalPrice()
            };

            if (isGuest) {
                try {
                    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cartToSave));
                } catch (storageError) {
                    console.log("Failed to save GUEST cart to local storage: ", storageError);
                }
            } else {
                try {
                    localStorage.setItem(USER_CART_KEY, JSON.stringify(cartToSave));
                } catch (storageError) {
                    console.log("Failed to save USER cart to local storage: ", storageError);
                }

                syncCartToDb(itemList); 
            }
        }, 500); 

        return () => clearTimeout(saveTimer);
    }, [itemList, isGuest, isLoading]);


    const handleRemoveItem = (itemID) => {
        setItemList(currentList => {
            const idKey = currentList.find(item => item.id) ? 'id' : 'product_id';
            return currentList.filter(item => item[idKey] !== itemID);
        });
    };

    const handleChangeRentalDays = (itemID, amount) => {
        setItemList(currentList => {
            const idKey = currentList.find(item => item.id) ? 'id' : 'product_id';
            return currentList.map(item => {
                if (item[idKey] !== itemID) return item;
                // 'item.rent_time' is guaranteed to exist now
                const newRentTime = Math.max(1, item.rent_time + amount);
                return { ...item, rent_time: newRentTime };
            })
        })
    }

    const handleCheckout = async(e) => {
        e.preventDefault();
        console.log('CHECK OUT TRIGGERED');
        
        const totalAmount = calculatedTotal;

        try {
            //Check session
            const sessionRes = await fetch('/api/users/me', {
                credentials: 'include',
                cache: 'no-cache'
            });

            if (sessionRes.ok) {
                console.log("Has session! Proceeding to checkout!");
                
                navigate('/payment', { state: { totalAmount: totalAmount, cartItems: itemList } });
            } else {
                console.log("No session, redirecting to login!");
                
                try {
                    const cartToSave = {
                        "items" : itemList,
                        "total_cost" : totalAmount
                    };
                    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cartToSave));
                } catch (storageError) {
                    console.error("Failed to save cart before login redirect:", storageError);
                }
                
                navigate("/login");
            }
        } catch (error) {
            console.error('Error checking session status:', error);
        }
    }

    // Calculate total price based on quantity, rental days, and individual prices
    const calculateTotalPrice = () => {
        if (!itemList || itemList.length === 0) {
            return 0;
        }

        const total = itemList.reduce((accumulator, item) => {
            const price = Number(item.price_per_day || item.unit_price) || 0;
            const sale = Number(item.sale_percentage) || 0;
            const rentTime = Number(item.rent_time) || 1;

            const itemPrice = price * (1 - sale / 100.0);
            // Each product is unique, so quantity is always 1
            return accumulator + (itemPrice * rentTime);
        }, 0); 

        return Number(total.toFixed(2));
    }

    const calculatedTotal = calculateTotalPrice();

    console.log("Cart Items: ", itemList);
    
    return (
        <div className=''>
            <Header onLoginClick={() => navigate("/")} onSignUpClick={() => navigate("/signup")} onProfileClick={() => navigate("/profile")} onAdminClick={() => navigate("/admin")} onCartClick={() => navigate("/cart")}/>
            <div className='flex flex-col gap-4 ml-4 md:ml-16 mr-4 md:mr-16 my-8'>
                <h1 className='text-4xl font-black'>Your Cart {itemList.length <=0 ? " is Empty" : ""}</h1>
                <div className='flex flex-row gap-4'>
                    {/* Cart items will be displayed here */}
                    <div className='flex-[3] border-2 border-gray-200 rounded-xl'>
                        {itemList.map((item, index) => (
                            <Fragment key={item.id ?? item.product_id}>
                                <div className='flex flex-row gap-4 m-4 items-start'>
                                    {/* Item Image */}
                                    <div className='flex-shrink-0'>
                                        <img src={item.metadata.images[0]} alt={item.name} className='w-24 h-24 md:w-28 md:h-28 rounded-xl object-cover'/>
                                    </div>

                                    {/* Item Info */}
                                    <div className='flex-1 flex flex-col gap-2 min-w-0'>
                                        <h2 className='text-base md:text-xl font-bold'>{item.name}</h2>
                                        {item.properties && (
                                            <div className={`grid grid-flow-col grid-rows-2 grid-cols-${cols} items-start gap-x-4`}>
                                                {Object.entries(item.properties).map(([key, value]) => (
                                                    <div key={key}>
                                                        <span className='text-sm text-black'>{key.slice(0, 1).toUpperCase() + key.slice(1,)}: </span>
                                                        <span className='text-sm text-gray-700'>{value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div className='mt-auto'>
                                            <span className='text-sm text-gray-600 block'>${item.price_per_day || item.total_price}/day × {item.rent_time || item.rentalDays} day{item.rent_time || item.rentalDays > 1 ? 's' : ''}</span>
                                            <span className='text-xl font-bold text-black'>${(item.price_per_day || item.total_price) * (item.rent_time || item.rentalDays)}</span>
                                        </div>
                                    </div>
                                    
                                    {/* More Interactions */}
                                    <div className='flex-shrink-0 flex flex-col items-end gap-3'>
                                        {/* Remove Item From Cart */}
                                        <button className='flex flex-row justify-end' onClick={() => handleRemoveItem(item.id)}>
                                            <svg 
                                                xmlns="http://www.w3.org/2000/svg" 
                                                viewBox="0 0 24 24" 
                                                fill="currentColor" 
                                                className="w-5 h-5 text-red-500 hover:text-red-700"
                                            >
                                                <path 
                                                fillRule="evenodd" 
                                                d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zM6.115 6.103a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0v-12a.75.75 0 01.75-.75zm6.75 0a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0v-12a.75.75 0 01.75-.75zm-3.375 0a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0v-12a.75.75 0 01.75-.75z" 
                                                clipRule="evenodd" 
                                                />
                                            </svg>
                                        </button>

                                        {/* Rental Days Selector */}
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs text-gray-500 text-center">Rental Days</span>
                                            <div className="flex items-center bg-gray-100 rounded-full px-3 py-2">
                                                <button className='text-lg font-bold px-2 disabled:opacity-50' onClick={() => handleChangeRentalDays(item.id ?? item.product_id, -1)} disabled={item.rent_time === 1} >-</button>
                                                <span className='font-bold text-base min-w-[2rem] text-center'>{item.rent_time}</span>
                                                <button className='text-lg font-bold px-2' onClick={() => handleChangeRentalDays(item.id ?? item.product_id, +1)}>+</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {index < countItems - 1 && (
                                    <hr className='border-t-2 border-gray-100 mx-4' />
                                )}
                            </Fragment>
                        ))}
                    </div>

                    {/* Summary and Checkout */}
                    <div className='flex-[2] flex flex-col border-2 border-gray-200 rounded-xl'>
                        <h2 className='text-xl md:text-2xl font-bold ml-4 mt-4'>Order Summary</h2>
                        <div className='flex flex-col gap-4 my-4 mx-4 text-lg font-bold'>
                            {/* <div className='flex flex-row relative w-full'>
                                <div className='font-medium text-gray-500'>Subtotal</div>
                                <div className='absolute right-0 text-2xl'>${calculatedTotal}</div>
                            </div> */}

                            <hr className='border-t-2 border-gray-100' />
                            <div className='flex flex-row relative w-full'>
                                    <div className='font-medium text-black '>Total</div>
                                    <div className='absolute right-0 text-2xl'>${calculatedTotal}</div>
                            </div>

                            {/* Promo Code Section */}
                            {/* <div className='flex flex-row gap-3 items-center'>
                                <div className='flex-1 flex flex-row items-center gap-3 bg-gray-100 rounded-full px-4 py-3'>
                                    <BsTag className='text-gray-400 w-5 h-5' />
                                    <input 
                                        type='text' 
                                        placeholder='Add promo code' 
                                        className='bg-transparent w-full focus:outline-none text-gray-600 font-medium placeholder-gray-400 text-base' 
                                    />
                                </div>
                                <button className='border-2 border-black bg-black hover:bg-white text-white hover:text-black ease-in-out duration-300 px-7 py-3 rounded-2xl font-semibold text-base'>
                                    Apply
                                </button>
                            </div> */}

                            {/* Checkout Button */}
                            <button 
                                // onClick={() => navigate('/payment', { state: { totalAmount: calculatedTotal + 10 } })}
                                onClick={(e) => handleCheckout(e)}
                                className='group w-full border-2 border-black bg-black hover:bg-white text-white hover:text-black transition-all ease-in-out duration-300 rounded-full py-4 flex justify-center items-center font-bold text-lg gap-2'
                            >
                                <span>Go to Checkout</span>
                                <HiOutlineArrowRight className='w-5 h-5 transition-transform ease-in-out duration-300 group-hover:translate-x-2 md:group-hover:translate-x-10 hover:overflow-hidden' />
                            </button>
                            
                        </div>

                    </div>
                </div>
            </div>
            
            <Footer />
        </div>
    )
}

export default CartPage;
