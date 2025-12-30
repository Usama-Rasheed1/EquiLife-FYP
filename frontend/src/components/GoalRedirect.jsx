import { Navigate } from "react-router-dom";

const GoalRedirect = () => {
  // Redirect all goal detail pages back to the main goals page
  return <Navigate to="/dashboard/goals" replace />;
};

export default GoalRedirect;

