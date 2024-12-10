import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from 'axios';

const DashboardComponent = () => {
  const { userId } = useParams();
  const [userData, setUserData] = useState(null);
  const [isAddingIncome, setIsAddingIncome] = useState(false);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [incomeDescription, setIncomeDescription] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [newAmount, setNewAmount] = useState('');
  const [newSource, setNewSource] = useState('');
  const [newMonthlyIncomeGoal, setNewMonthlyIncomeGoal] = useState('');
  const [newMonthlyExpenseGoal, setNewMonthlyExpenseGoal] = useState('');
  const [newActualIncome, setNewActualIncome] = useState('');
  const [newActualExpenses, setNewActualExpenses] = useState('');
  const [updatedIncome, setUpdatedIncome] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllIncome, setShowAllIncome] = useState(false);
  const [showAllExpense, setShowAllExpense] = useState(false);

  const backEndUrl = import.meta.env.VITE_REACT_APP_BACKEND_API;


  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${backEndUrl}/users/${userId}/income`);
        setUserData(response.data);
        console.log('user data:', response.data);
        setUpdatedIncome(response.data);
        console.log('updatedIncome:', response.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);  
      }
    };
  
    if (userId && backEndUrl) {
      fetchUserData();
    }
  }, [userId, backEndUrl]);
  
  const formatCurrency = (value) => {
    const numberValue = typeof value === 'number' ? value : parseFloat(value);

    if (isNaN(numberValue)) {
      return `$0.00`; 
    }

    return `$${numberValue.toFixed(2)}`;
  }

  // Function for total income

  const totalIncome = (incomes) => {
    const sumOfIncomes = incomes.reduce((a, b) => a + parseFloat(b.amount), 0);
    return formatCurrency(sumOfIncomes); 
  };

  // Function to update income
  const updateIncome = async (incomeId, updatedAmount, updatedSource) => {
    if (!incomeId || isNaN(parseFloat(updatedAmount)) || updatedAmount <= 0 || updatedSource.trim() === "") {
        alert("Please provide valid income details.");
        return;
}

try {
 //Update Income put request
  const response = await axios.put(`/users/${userId}/income/${incomeId}`, {
    amount: updatedAmount,
    source: updatedSource,
  });

  const updatedIncome = response.data;
  console.log('updatedIncome:', updatedIncome);

  setUserData(prevData => {
    const updatedActivities = prevData.recentActivities.map(activity =>
      activity.type === "Income" && activity.id === incomeId
        ? { ...activity, amount: updatedIncome.amount, description: updatedIncome.source }
        : activity
    );

    const newIncome = prevData.stats.income - 
                      prevData.recentActivities.find(a => a.id === incomeId)?.amount + 
                      updatedIncome.amount;

    return {
      ...prevData,
      stats: {
        ...prevData.stats,
        income: newIncome,
      },
      recentActivities: updatedActivities,
    };
  });

  alert("Income updated successfully!");
} catch (error) {
  console.error("Error updating income:", error);
  alert("There was an error updating your income. Please try again.");
}
};


  //Function to add income
  const addIncome = async () => {
    const amount = parseFloat(incomeAmount);

    if (isNaN(amount) || amount <= 0 || incomeDescription.trim() === "") {
        alert("Please provide valid income description and amount.");
        return;
    }

    const dateReceived = new Date().toLocaleDateString("en-CA"); // Format: YYYY-MM-DD

    console.log("Attempting to add income with details:", {
        userId,
        amount,
        description: incomeDescription,
        dateReceived,
    });

    try {
        const response = await axios.post(`${backEndUrl}/users/${userId}/income`, {
            user_id: userId,
            amount: amount.toFixed(2), 
            source: incomeDescription,
            date_received: dateReceived,
            created_at: new Date().toISOString(), 
        });

        console.log("Response add income:", response);

        // Update user data directly
        setUserData((prevData) => {
            console.log("prevData:", prevData);

            // Add the new income object
            const newIncome = {
                id: response.data.id, 
                user_id: userId,
                amount: amount.toFixed(2),
                source: incomeDescription,
                date_received: dateReceived,
                created_at: new Date().toISOString(),
                User: prevData?.User || null, 
            };

            return [...prevData, newIncome]; 
        });

        // Reset form fields
        setIncomeDescription("");
        setIncomeAmount("");
        setIsAddingIncome(false);
    } catch (error) {
        console.error("Error adding income:", error);
        alert("There was an error adding your income. Please try again.");
    }
};




  // Function to delete income
  const deleteIncome = async (incomeId) => {
    if (!incomeId) {
        alert("Invalid income ID.");
        return;
}

try {
  // Send DELETE request to backend to remove the income record
  await axios.delete(`${backEndUrl}/users/${userId}/income/${incomeId}`);

  // Update the state to remove the deleted income from activities and stats
  setUserData(prevData => {
    const deletedIncome = prevData.recentActivities.find(
      activity => activity.type === "Income" && activity.id === incomeId
    );

    if (!deletedIncome) return prevData;

    const newIncome = prevData.stats.income - deletedIncome.amount;
    const newBalance = prevData.stats.balance - deletedIncome.amount;

    const updatedActivities = prevData.recentActivities.filter(
      activity => !(activity.type === "Income" && activity.id === incomeId)
    );

    return {
      ...prevData,
      stats: {
        ...prevData.stats,
        income: newIncome,
        balance: newBalance,
      },
      recentActivities: updatedActivities,
    };
  });

  alert("Income record deleted successfully!");
} catch (error) {
  console.error("Error deleting income:", error);
  alert("There was an error deleting your income record. Please try again.");
}
};

 // Function to add expense
 const addExpense = async () => {
  const amount = parseFloat(expenseAmount);

  if (isNaN(amount) || amount <= 0 || expenseDescription.trim() === "") {
      alert("Please provide valid expense description and amount.");
      return;
  }

  const dateIncurred = new Date().toLocaleDateString('en-CA'); // Format date as 'YYYY-MM-DD'

  try {
      // Send POST request to backend to create a new expense record
      await axios.post(`${backEndUrl}/users/${userId}/expenses`, {
      user_id: userId,            
      amount: amount,
      category: expenseDescription,
      date_incurred: dateIncurred, 
  });

// Update user data directly
setUserData(prevData => {
  const newExpenseAmount = prevData.stats.expenses + amount;
  const newBalance = prevData.stats.balance - amount;
  const newActivity = { type: "Expense", description: expenseDescription, amount, date: dateIncurred };

  return {
    ...prevData,
    stats: {
      ...prevData.stats,
      expenses: newExpenseAmount,
      balance: newBalance,
    },
    recentActivities: [newActivity, ...prevData.recentActivities],
  };
});

// Clear inputs and close the form
setExpenseDescription("");
setExpenseAmount("");
setIsAddingExpense(false);
} catch (error) {
console.error("Error adding expense:", error);
alert("There was an error adding your expense. Please try again.");
}
};

// Function to create a budget
const createBudget = async (budgetData) => {
  const {
    monthlyIncomeGoal,
    monthlyExpenseGoal,
    actualIncome,
    actualExpenses,
  } = budgetData;

  if (
    isNaN(monthlyIncomeGoal) ||
    isNaN(monthlyExpenseGoal) ||
    isNaN(actualIncome) ||
    isNaN(actualExpenses)
  ) {
    alert("Please provide valid numbers for all fields.");
    return;
  }

  try {
    // Send POST request to backend to create the budget
    const response = await axios.post(`${backEndUrl}/users/${userId}/budget`, {
      monthly_income_goal: parseFloat(monthlyIncomeGoal),
      monthly_expense_goal: parseFloat(monthlyExpenseGoal),
      actual_income: parseFloat(actualIncome),
      actual_expenses: parseFloat(actualExpenses),
    });

    const newBudget = response.data;

    // Update the state with the new budget
    setUserData(prevData => ({
      ...prevData,
      budget: newBudget,
    }));

    alert("Budget created successfully!");
  } catch (error) {
    console.error("Error creating budget:", error);
    alert("There was an error creating your budget. Please try again.");
  }
};


 
// Function to update budget
  const updateBudget = async (budgetId, updatedBudgetData) => {
    const {
      monthlyIncomeGoal,
      monthlyExpenseGoal,
      actualIncome,
      actualExpenses,
    } = updatedBudgetData;
  
    if (
      isNaN(monthlyIncomeGoal) ||
      isNaN(monthlyExpenseGoal) ||
      isNaN(actualIncome) ||
      isNaN(actualExpenses)
    ) {
      alert("Please provide valid numbers for all fields.");
      return;
    }
  
    try {
      const response = await axios.put(`${backEndUrl}/users/${userId}/budget/${budgetId}`, {
        monthly_income_goal: parseFloat(monthlyIncomeGoal),
        monthly_expense_goal: parseFloat(monthlyExpenseGoal),
        actual_income: parseFloat(actualIncome),
        actual_expenses: parseFloat(actualExpenses),
      });
  
      const updatedBudget = response.data;
  
      // Update the state with the updated budget
      setUserData(prevData => ({
        ...prevData,
        budget: updatedBudget,
      }));
  
      alert("Budget updated successfully!");
    } catch (error) {
      console.error("Error updating budget:", error);
      alert("There was an error updating your budget. Please try again.");
    }
  };


  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 bg-gray-100 rounded-lg shadow-lg">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Financial Dashboard</h1>
      </header>
      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Income Section */}
        <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Income</h2>
          {isAddingIncome ? (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Income Source"
                value={incomeDescription}
                onChange={(e) => setIncomeDescription(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                type="number"
                placeholder="Amount"
                value={incomeAmount}
                onChange={(e) => setIncomeAmount(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <div className="flex space-x-4">
                <button
                  className="bg-green-500 text-white px-5 py-2 rounded-lg hover:bg-green-600 transition-colors"
                  onClick={addIncome}
                >
                  Add
                </button>
                <button
                  className="bg-gray-400 text-white px-5 py-2 rounded-lg hover:bg-gray-500 transition-colors"
                  onClick={() => setIsAddingIncome(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              className="bg-blue-500 text-white px-5 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              onClick={() => setIsAddingIncome(true)}
            >
              Add Income
            </button>
          )}
        </div>
  
        {/* Expense Section */}
        <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Expenses</h2>
          {isAddingExpense ? (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Expense Description"
                value={expenseDescription}
                onChange={(e) => setExpenseDescription(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                type="number"
                placeholder="Amount"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <div className="flex space-x-4">
                <button
                  className="bg-green-500 text-white px-5 py-2 rounded-lg hover:bg-green-600 transition-colors"
                  onClick={addExpense}
                >
                  Add
                </button>
                <button
                  className="bg-gray-400 text-white px-5 py-2 rounded-lg hover:bg-gray-500 transition-colors"
                  onClick={() => setIsAddingExpense(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              className="bg-blue-500 text-white px-5 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              onClick={() => setIsAddingExpense(true)}
            >
              Add Expense
            </button>
          )}
          <ul className="mt-4 space-y-3">
            {userData?.recentActivities
              ?.filter((activity) => activity.type === "Expense")
              .map((expense) => (
                <li
                  key={expense.id}
                  className="flex justify-between items-center border-b border-gray-200 pb-2"
                >
                  <span>{expense.description} - {formatCurrency(expense.amount)}</span>
                </li>
              ))}
          </ul>
        </div>
  
        {/* Budget Section */}
        <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Budget</h2>
          {userData?.budget ? (
            <div>
              <p className="text-gray-600">
                Income Goal: <strong className="text-green-600">{formatCurrency(userData.budget.monthly_income_goal)}</strong>
              </p>
              <p className="text-gray-600">
                Expense Goal: <strong className="text-red-600">{formatCurrency(userData.budget.monthly_expense_goal)}</strong>
              </p>
              <p className="text-gray-600">
                Actual Income: <strong className="text-green-600">{formatCurrency(userData.budget.actual_income)}</strong>
              </p>
              <p className="text-gray-600">
                Actual Expenses: <strong className="text-red-600">{formatCurrency(userData.budget.actual_expenses)}</strong>
              </p>
              <button
                className="bg-blue-500 text-white px-5 py-2 rounded-lg hover:bg-blue-600 mt-4 transition-colors"
                onClick={() => updateBudget(userData.budget.id, {
                  monthlyIncomeGoal: newMonthlyIncomeGoal,
                  monthlyExpenseGoal: newMonthlyExpenseGoal,
                  actualIncome: newActualIncome,
                  actualExpenses: newActualExpenses,
                })}
              >
                Update Budget
              </button>
            </div>
          ) : (
            <button
              className="bg-green-500 text-white px-5 py-2 rounded-lg hover:bg-green-600 transition-colors"
              onClick={() => createBudget({
                monthlyIncomeGoal: newMonthlyIncomeGoal,
                monthlyExpenseGoal: newMonthlyExpenseGoal,
                actualIncome: newActualIncome,
                actualExpenses: newActualExpenses,
              })}
            >
              Create Budget
            </button>
          )}
        </div>
      </main>
  
      {/* Added Income Section */}
      <div className="bg-white shadow-lg rounded-lg p-6 mt-6 border border-gray-200">
         <h2 className="text-xl font-semibold text-gray-700 mb-4">Added Incomes</h2>
          <table className="table-auto w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left text-gray-600">Source</th>
                <th className="border border-gray-300 px-4 py-2 text-right text-gray-600">Income</th>
                <th className="border border-gray-300 px-4 py-2 text-center text-gray-600">Date Received</th>
                <th className="border border-gray-300 px-4 py-2 text-center text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {userData?.slice(0, showAllIncome ? userData.length : 4).reverse().map((income) => (
                <tr key={income.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2 text-gray-800">{income.source}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right text-gray-800">{formatCurrency(income.amount)}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center text-gray-800">{income.date_received}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    <button
                      className="text-sm bg-yellow-500 text-white px-3 py-1 rounded-lg hover:bg-yellow-600 transition-colors mr-2"
                      onClick={() => updateIncome(income.id, newAmount, newSource)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-sm bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition-colors"
                      onClick={() => deleteIncome(income.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

      <div className="mt-4 text-right font-semibold text-xl text-gray-700">
       Total Income: {totalIncome(userData)}
     </div>
  <button
    className="mt-4 text-blue-500 hover:underline"
    onClick={() => setShowAllIncome((prevState) => !prevState)}
  >
    {showAllIncome ? "See Less" : "See More"}
  </button>
      </div>

      {/* Added Expense Section */}
      <div className="bg-white shadow-lg rounded-lg p-6 mt-6 border border-gray-200">
         <h2 className="text-xl font-semibold text-gray-700 mb-4">Added Expenses</h2>
          <table className="table-auto w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left text-gray-600">Source</th>
                <th className="border border-gray-300 px-4 py-2 text-right text-gray-600">Expense</th>
                <th className="border border-gray-300 px-4 py-2 text-center text-gray-600">Date Received</th>
                <th className="border border-gray-300 px-4 py-2 text-center text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {userData?.slice(0, showAllExpense ? userData.length : 4).reverse().map((income) => (
                <tr key={income.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2 text-gray-800">{income.source}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right text-gray-800">{formatCurrency(income.amount)}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center text-gray-800">{income.date_received}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    <button
                      className="text-sm bg-yellow-500 text-white px-3 py-1 rounded-lg hover:bg-yellow-600 transition-colors mr-2"
                      onClick={() => updateIncome(income.id, newAmount, newSource)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-sm bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition-colors"
                      onClick={() => deleteIncome(income.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

      <div className="mt-4 text-right font-semibold text-xl text-gray-700">
       Total Income: {totalIncome(userData)}
     </div>
  <button
    className="mt-4 text-blue-500 hover:underline"
    onClick={() => setShowAllExpense((prevState) => !prevState)}
  >
    {showAllExpense ? "See Less" : "See More"}
  </button>
</div>

    </div>
  );
  
  
  
};

export default DashboardComponent;


