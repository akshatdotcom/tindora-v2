import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { Chart, ArcElement, Tooltip } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import MealCard from './MealCard';
import profile from '../assets/profile-user.png';
import ingredientsIcon from '../assets/tomato.png';
import receiptsIcon from '../assets/receipt.png';
import favoriteIcon from '../assets/star-filled.png';
import { db } from '../firebase/db.js';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from "firebase/auth";

Chart.register(ArcElement, Tooltip);

const Profile = () => {
  const [profileData, setProfileData] = useState(null);
  const [selectedDietaryRestrictions, setSelectedDietaryRestrictions] = useState([]);
  const [selectedCuisines, setSelectedCuisines] = useState([]);
  const [favoriteMeals, setFavoriteMeals] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfileData(data);
          setSelectedDietaryRestrictions(data.dietaryRestrictions || []);
          setSelectedCuisines(data.cuisines || []);
        } else {
          console.log('No such document!');
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      }
    };

    const fetchFavoriteMeals = async () => {
      try {
        const favoriteMealsRef = collection(db, `users/${currentUser.uid}/favoriteMeals`);
        const favoriteMealsSnapshot = await getDocs(favoriteMealsRef);
        const meals = favoriteMealsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFavoriteMeals(meals);
      } catch (error) {
        console.error('Error fetching favorite meals:', error);
      }
    };

    if (currentUser?.uid) {
      fetchProfileData();
      fetchFavoriteMeals();
    }
  }, [currentUser?.uid]);

  if (!profileData) {
    return <div>Loading...</div>;
  }

  const dietaryOptions = [
    { value: 'vegetarian', label: 'Vegetarian', color: '#4caf50' },
    { value: 'vegan', label: 'Vegan', color: '#ff9800' },
    { value: 'gluten-free', label: 'Gluten-Free', color: '#2196f3' },
    { value: 'nut-allergies', label: 'Nut Allergies', color: '#f44336' },
  ];

  const cuisineOptions = [
    { value: 'italian', label: 'Italian', color: '#e91e63' },
    { value: 'indian', label: 'Indian', color: '#9c27b0' },
    { value: 'chinese', label: 'Chinese', color: '#3f51b5' },
    { value: 'thai', label: 'Thai', color: '#00bcd4' },
    { value: 'french', label: 'French', color: '#8bc34a' },
  ];

  const customStyles = {
    option: (provided, state) => ({
      ...provided,
      color: state.data.color,
    }),
    multiValue: (provided, state) => ({
      ...provided,
      backgroundColor: state.data.color,
    }),
    multiValueLabel: (provided, state) => ({
      ...provided,
      color: 'white',
    }),
    multiValueRemove: (provided, state) => ({
      ...provided,
      color: 'white',
      ':hover': {
        backgroundColor: state.data.color,
        color: 'black',
      },
    }),
  };

  const donutData = {
    labels: ['Accepted', 'Rejected'],
    datasets: [
      {
        data: [profileData.mealsAccepted || 0, profileData.mealsRejected || 0],
        backgroundColor: ['#15803d', '#921A40'],
        hoverBackgroundColor: ['#16a34a', '#C75B7A'],
      },
    ],
  };

  const donutOptions = {
    plugins: {
      tooltip: {
        callbacks: {
          label: function(tooltipItem) {
            const dataset = tooltipItem.dataset;
            const index = tooltipItem.dataIndex;
            const label = donutData.labels[index];
            const value = dataset.data[index];
            return `${label}: ${value}`;
          },
        },
      },
    },
  };

  const handleSavePreferences = async () => {
    const preferencesData = {
      dietaryRestrictions: selectedDietaryRestrictions,
      cuisines: selectedCuisines,
    };
  
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, preferencesData);
      console.log('Preferences saved:', preferencesData);
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const handleAccept = () => {
    // Dummy function for now
  };

  const handleReject = () => {
    // Dummy function for now
  };

  return (
    <div className="bg-custom-white">
      <div className="flex flex-col items-center w-4/5 h-4/5 mx-auto bg-custom-red p-5 shadow-lg rounded-lg">
        <div className="flex justify-between w-full mb-3 space-x-5">
          <div className="bg-white rounded-lg p-5 w-1/4 shadow-md flex flex-col items-center">
            <img src={profile} alt="Profile" className="w-36 h-36 rounded-full mb-3 border border-black" />
            <div className="text-center">
              <h2 className="text-black text-2xl">{profileData.name}</h2>
              <p className="text-gray-500 text-sm">{profileData.email}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-5 w-1/4 shadow-md flex flex-col items-center">
            {profileData.mealsAccepted + profileData.mealsRejected === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-custom-red-200 text-2xl font-bold">Start Swiping!</p>
                <p className="text-gray-500 text-xl">0 Meals Generated</p>
              </div>
            ) : (
              <>
                <Doughnut data={donutData} options={donutOptions} />
                <div className="text-center mt-2">
                  <p className="text-custom-red-200 text-2xl font-bold">{profileData.mealsAccepted + profileData.mealsRejected}</p>
                  <span className="text-gray-500">Meals Generated</span>
                </div>
              </>
            )}
          </div>
          <div className="bg-white rounded-lg p-5 w-1/4 shadow-md">
            <div className="flex flex-col gap-5">
              <h4 className="font-bold text-center">Preferences</h4>
              <Select
                options={dietaryOptions.filter(option => !selectedDietaryRestrictions.includes(option.label))}
                isMulti
                placeholder="Dietary Restrictions"
                styles={customStyles}
                value={selectedDietaryRestrictions.map(label => dietaryOptions.find(option => option.label === label))}
                onChange={(selectedOptions) => setSelectedDietaryRestrictions(selectedOptions.map(option => option.label))}
              />
              <Select
                options={cuisineOptions.filter(option => !selectedCuisines.includes(option.label))}
                isMulti
                placeholder="Preferred Cuisines"
                styles={customStyles}
                value={selectedCuisines.map(label => cuisineOptions.find(option => option.label === label))}
                onChange={(selectedOptions) => setSelectedCuisines(selectedOptions.map(option => option.label))}
              />
              <button 
                className="mt-5 bg-custom-red-300 text-white font-bold rounded-md py-3 px-6 hover:bg-custom-red-200 mx-auto"
                onClick={handleSavePreferences}
              >
              Save
            </button>
            </div>
          </div>
          <div className="bg-white rounded-lg p-5 w-1/4 shadow-md flex flex-col justify-between">
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-start bg-white border border-gray-300 rounded-lg p-3 shadow-sm">
                <img src={ingredientsIcon} alt="Ingredients" className="w-8 h-8 mr-2" />
                <p><strong className='text-custom-red-200'>{profileData.ingredientsSaved}</strong> Ingredients Saved</p>
              </div>
              <div className="flex items-center justify-start bg-white border border-gray-300 rounded-lg p-3 shadow-sm">
                <img src={receiptsIcon} alt="Receipts" className="w-8 h-8 mr-2" />
                <p><strong className='text-custom-red-200'>{profileData.receiptsUploaded}</strong> Receipts Uploaded</p>
              </div>
              <div className="flex items-center justify-start bg-white border border-gray-300 rounded-lg p-3 shadow-sm">
                <img src={favoriteIcon} alt="Favorites" className="w-8 h-8 mr-2" />
                <p><strong className='text-custom-red-200'>{profileData.mealsFavorited}</strong> Favorite Meals</p>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full">
          <h2 className="text-xl font-bold mb-3 text-center text-custom-red-300">Favorites:</h2>
          <div className="flex gap-5 overflow-x-auto whitespace-nowrap rounded-lg">
            {favoriteMeals.length === 0 ? (
              <p className="text-gray-500 mx-auto">No Favorites Yet!</p>
            ) : (
              favoriteMeals.map((meal, index) => (
                <MealCard key={index} meal={meal} isProfile={true} onAccept={handleAccept} onReject={handleReject} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;