import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  fullName: null,
  weight: null,
  dob: null,
  age: null,
  profilePhoto: null,
  heightCm: null,
  gender: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserData(state, action) {
      const payload = action.payload || {};
      if (payload.fullName !== undefined) state.fullName = payload.fullName;
      if (payload.weight !== undefined) state.weight = payload.weight;
      if (payload.dob !== undefined) state.dob = payload.dob;
      if (payload.age !== undefined) state.age = payload.age;
      if (payload.profilePhoto !== undefined) state.profilePhoto = payload.profilePhoto;
      if (payload.heightCm !== undefined) state.heightCm = payload.heightCm;
      if (payload.gender !== undefined) state.gender = payload.gender;
    },
    updateWeight(state, action) {
      state.weight = action.payload;
    },
    updateDob(state, action) {
      state.dob = action.payload;
    },
    updateAge(state, action) {
      state.age = action.payload;
    },
    updateProfilePhoto(state, action) {
      state.profilePhoto = action.payload;
    },
  },
});

export const { setUserData, updateWeight, updateDob, updateAge, updateProfilePhoto } = userSlice.actions;
export default userSlice.reducer;
