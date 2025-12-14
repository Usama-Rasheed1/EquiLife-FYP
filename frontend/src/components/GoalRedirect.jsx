import { Navigate, useParams } from "react-router-dom";

const GoalRedirect = () => {
  const { goalId } = useParams();
  return <Navigate to={`/dashboard/goals/${goalId}`} replace />;
};

export default GoalRedirect;

