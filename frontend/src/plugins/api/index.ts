import { useGuests } from "./guests";

const useAPI = () => {
  const guests = useGuests();

  return {
    ...guests,
  };
};

export default useAPI;
