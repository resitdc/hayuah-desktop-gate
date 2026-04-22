import axios from "../../axios";

interface GeneralParams {
  limit?: number;
  page?: number;
  search?: string;
  sort?: string;
};

export const useGuests = () => {
  const getListGuests = (
    eventId: string,
    params?: GeneralParams
  ) => {
    return axios.get(`/guest/guests/${eventId}`, { params });
  };

  const guestCheckin = (guestId: string, checkinType?: string) => {
    return axios.post(`/guest/guests/checkin`, {
      guestId,
      ...(checkinType ? { checkinType } : {})
    });
  };
  
  return {
    getListGuests,
    guestCheckin
  };
};
