import PropTypes from 'prop-types'; 
import SpecificMonthExpenseComponent from "./DashboardComponents/SpecificMonthExpenseComponent";
import SpecificMonthIncomeComponent from "./DashboardComponents/SpecificMonthIncomeComponent";

const MonthlyActivityComponent = ({ currentMonth, currentMonthIncome, currentMonthExpenses, showAllIncome, userData, filteredIncome, filteredExpense, getPreviousMonth, previousMonthExpenses}) => {


    // console.log('current month:', currentMonth);
    return (
        <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                {currentMonth}'s Activity
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SpecificMonthIncomeComponent currentMonth={currentMonth} 
                    currentMonthIncome={currentMonthIncome} 
                    showAllIncome={showAllIncome}
                    userData={userData}
                    filteredIncome={filteredIncome}
                    getPreviousMonth={getPreviousMonth}
                    />
                <SpecificMonthExpenseComponent currentMonth={currentMonth} 
                    currentMonthExpenses={currentMonthExpenses}
                    filteredExpense={filteredExpense}
                    getPreviousMonth={getPreviousMonth}
                    previousMonthExpenses={previousMonthExpenses}

                />
            </div>
        </div>
    );

};

MonthlyActivityComponent.propTypes = {
    currentMonth: PropTypes.string.isRequired, 
    currentMonthIncome: PropTypes.number.isRequired, 
    currentMonthExpenses: PropTypes.number.isRequired, 
    getPreviousMonth: PropTypes.string.isRequired
};

export default MonthlyActivityComponent;
