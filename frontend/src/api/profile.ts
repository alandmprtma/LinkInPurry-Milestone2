import { getToken } from "./auth";
import {PostData} from '../feedengine';

const API_URL = "http://localhost:3000/api";

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export interface formData{
  username: string | undefined;
  photo: File | undefined;
  name: string | undefined;
  work_history: string | undefined;
  skill: string | undefined;
};

export type profileInterface = {
  username: string;
  name: string;
  work_history: string;
  skills: string;
  connection_count: number;
  profile_photo: string;
  relevant_posts: PostData[] | undefined;
  profile_photo_path: string | undefined;
  self: boolean | undefined;
  id: number | undefined;
}

export type fetchProfileInterface = {
    success: boolean;
    message: string;
    body: profileInterface;
}


export async function fetchProfile(profileId: number): Promise<any> {
    //await sleep(500) //Simulate loading time
    try {
      const link = profileId != null && profileId != undefined ? `${API_URL}/profile/${profileId}` : `${API_URL}/profile`
      const response = await fetch(link, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      

      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }      

      const data = await response.json();
      console.log("lockin!",data)
      console.log("Ending")
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      console.log("Error")
      throw error;
    }
  }
  
export async function updateProfile(id : number, data : formData): Promise<any> {
  const { username, photo, name, work_history, skill } = data;

  // Create a FormData object
  const formdata = new FormData();
  if (username) formdata.append("username", username);
  if (name) formdata.append("name", name);
  if (work_history) formdata.append("work_history", work_history);
  if (skill) formdata.append("skill", skill);
  if (photo) formdata.append("photo", photo); // Append the File object

  const token = getToken();


  try{
    const response = await fetch(`${API_URL}/profile/${id}`, {
      method: "PUT",
      body: formdata,
      headers: {
          Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    } else {
      window.location.reload();
    }

    
  }
  catch (error) {
        console.error("Error:", error);
  }
}
