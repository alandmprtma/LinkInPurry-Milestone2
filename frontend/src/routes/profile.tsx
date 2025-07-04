import * as React from 'react';
import { useState } from 'react';
import { createFileRoute,useSearch } from '@tanstack/react-router';
import "./profile.css"
import "../App.css"
import {FeedsEngine} from '../feedengine';
import { fetchProfile, fetchProfileInterface, profileInterface, formData, updateProfile } from '../api/profile';
import Navbar from './-components/navbar';
import { FaUserPlus, FaCheck, FaConciergeBell, FaTimes, FaUserTimes} from 'react-icons/fa'; // Ikon untuk Connect dan Requested
import { UserData, sendConnectionRequest, getConnectionInfo } from '../api/connections';

export const Route = createFileRoute('/profile')({
  component: RouteComponent,
})



const EditContext = React.createContext<boolean>(false);
const ToggleEditContext = React.createContext<React.Dispatch<React.SetStateAction<boolean>> | undefined>(undefined);


interface EditFormContextType {
  formData: formData;
  updateFormData: (name: string, value: string | File) => void;
}

const EditFormContext = React.createContext<EditFormContextType | undefined>(undefined);

const useEditFormContext = () => {
  const context = React.useContext(EditFormContext);
  if (!context) {
    throw new Error("useFormContext must be used within a FormProvider");
  }
  return context;
};

function RouteComponent() {
  const [search, setSearch] = useState('');
  return (
    <>
       <Navbar  inputString="" onSearchChange={setSearch} />
      <div className="w-full lg:w-10/12 justify-center mx-auto flex flex-row">
        <ProfileContent />
      </div>
    </>
  );
}

const FetchContext = React.createContext<profileInterface>({
  username: "",
  name: "",
  work_history: "",
  skills: "",
  connection_count: -3,
  profile_photo: "",
  relevant_posts: undefined,
  profile_photo_path: '/default/profile.png',
  self: false,
  id: undefined
})

function ProfileContent() {

  const Search : {id : number} = useSearch({from : Route.id})
  const profileId = Search.id

  const [content, setContent] = React.useState<JSX.Element | null>(null); // For rendering profile content
  const displayContent = React.useDeferredValue(content); // Defer updates for smoother rendering
  const [editing, toggleEditting] = React.useState(false);

  function toggleEdit() {
    toggleEditting(!editing)
  }

  React.useEffect(() => {
    const fetchAndSetProfile = async () => {
      try {
        // Show loading screen while fetching data
        // In the future, change to some sort of blur screen spinner
        setContent(<h1>Loading...</h1>);

        // Fetch profile data
        const fetchData : fetchProfileInterface = await fetchProfile(profileId);
        const profileData : profileInterface = fetchData.body;

        console.log(fetchData);

        // Change content to profile darta
        //             <h2>Viewing : {fetchData.message}</h2>
        setContent(
          <FetchContext.Provider value={profileData}>
          <EditProfileProvider initial_values={profileData}>
            <ProfileHeader data={profileData}/>
            <JobHistory data={profileData}/>
            {fetchData.body.relevant_posts? <FeedsEngine initialposts={fetchData.body.relevant_posts}/> : null}
          </EditProfileProvider>
          </FetchContext.Provider>
        );
      } catch (error) {
        // Error for fetch fail
        console.error(error);
        setContent(<h1>Error fetching profile data.</h1>);
      }
    };

    fetchAndSetProfile();
  }, [profileId]);



  return (
    <>
      <EditContext.Provider value={editing}>
      <ToggleEditContext.Provider value={toggleEdit}>   
        <div className="w-5/6 lg:w-11/12" id="profile-content">
        {displayContent}
        </div>
        <Miscbar/>
      </ToggleEditContext.Provider >
      </EditContext.Provider>
    </>
  )
}

//All will use state
function ProfileHeader({data} : {data : profileInterface | undefined}) {
  const editing = React.useContext(EditContext)

  const { formData, updateFormData } = useEditFormContext()

  const d = data ? (data) : (
    {
        username: "Username",
        name: "Name",
        work_history: "No Work",
        skills: "No skills",
        connection_count: -1,
        profile_photo_path: '/default/profile.png'
    }
  )

  return (
    <div className="m-2 bg-white rounded-lg shadow-lg text-left">
      <div className="overflow-hidden rounded-t-lg">
        <img 
          src="https://placehold.co/800x200.png" 
          className="object-cover w-full w-auto h-44 md:h-full md:w-full" 
        />
      </div>
      <span className="flex h-4 lg:h-10 justify-between">
        <img
          src={d.profile_photo_path}
          className="-translate-y-1/2 ml-10 outline outline-cyan-600 rounded-full w-24 h-24 lg:w-32 lg:h-32"
        />
        <div>
          {data?.self? <SaveOrEdit /> : null}
        </div>
      </span>
      <div className="p-8">
      {editing ? (<>
        <small>Full Name</small>
            <input
              name="name"
              value={formData.name || ""}
              onChange={(e) => updateFormData("name", e.target.value)}
              className="block w-full mb-4 p-2 border rounded bg-white"
              placeholder="Enter name"
            />
            <small>Skill</small>
            <input
              name="skill"
              value={formData.skill || ""}
              onChange={(e) => updateFormData("skill", e.target.value)}
              className="block w-full mb-4 p-2 border rounded bg-white"
              placeholder="Enter skill"
            />
            <small>Profile picture</small>
            {formData.photo && (
              <div className="preview">
                <p>Selected Image:</p>
                <img 
                  src={URL.createObjectURL(formData.photo)} 
                  alt="Preview" 
                  style={{ width: "100px", height: "100px", objectFit: "cover" }} 
                />
              </div>
            )}
            <label>Image file
            <input type="file" name="myImage" accept="image/png, image/gif, image/jpeg" onChange={(e) => {
                  const file = e.target.files?.[0]; // Always get the first file
                  if (file) {
                    updateFormData("photo", file);
                  }}}
            />
            </label>
      </>
      ) : (
         <>
         <span className="flex items-end">
           <h1 className="text-gray-500 text-5xl lg:text-6xl" id='name' >{d.name}</h1>
           <h2 className="text-sm lg:text-xl pl-5" id='skill'>{d.skills}</h2>
         </span>
         <h3 className="ps-0" id='username'>{d.username}</h3>
         <h2 className="py-2">{d.connection_count} Connections</h2>
         {d.connection_count >= 0 ? (<ConnectBar/>) : null}
         </>
      )}
      </div>
       
    </div>
  );
}




  
function SaveOrEdit() {
  const editing = React.useContext(EditContext)
  const toggleEdit = React.useContext(ToggleEditContext)
  const formData = useEditFormContext().formData
  const id = React.useContext(FetchContext).id

  if (toggleEdit === undefined) {
    throw new Error('ToggleEditContext is undefined for Provider!');
  }

  return (
    <div className="m-4">
      {editing && id ? (
        <>
          <button className="px-4 py-2 mx-2 border border-[#0a66c2] bg-blue-500 hover:bg-transparent rounded-[25px] hover:bg-blue-300 focus:outline-none space-x-2 text-white" onClick={() => {updateProfile(id,formData)}}>
            Save
          </button>
          <button className="px-4 py-2 mx-2 border bg-red-500 hover:bg-red-300 hover:border-red-500 rounded-[25px] hover:bg-white focus:outline-none space-x-2 text-white" onClick={() => {toggleEdit(!editing)}}>
            Cancel
          </button>
        </>
      ) : (
        <button className="px-4 py-2 mx-2 border bg-transparent border-[#0a66c2] bg--blue-500 rounded-[25px] hover:bg-blue-50 focus:outline-none space-x-2 text-blue-500" onClick={() => {toggleEdit(!editing)}}>
          Edit Profile
        </button>
      )}
    </div>
  );
}


//This will fetch the user description from back end when its available
function UserDescription() {
  return (
    <div className="p-8 m-2 bg-white rounded-lg shadow-lg text-left">
      <h1 className="text-black">
        About me :
      </h1>
      <h2 className="text-black">
        Lorem Ipsum sit dolor amet
      </h2>
    </div>
  )
}

function Miscbar() {
  return (
    <div className="p-8 m-2 bg-white rounded-lg shadow-lg w-0 lg:w-6/12 lg:block hidden">
      <h1 className="text-black">
        About me :
      </h1>
      <h2 className="text-black">
        Lorem Ipsum sit dolor amet
      </h2>
    </div>
  )
}

//Logged in users only, Not self
function ConnectBar() {
  const Search: { id: number } = useSearch({ from: Route.id });
  const profileId = Search.id;

  const [user, setUser] = React.useState<UserData | null>(null);

  React.useEffect(() => {
    const fetchStatus = async () => {
      try {
        const result = await getConnectionInfo(profileId);

        const users: UserData[] = result.body;
        const fetchedUser = users[0];
        setUser(fetchedUser);
        console.log(fetchedUser)
      } catch (error) {
        console.error("Error fetching connection info:", error);
      }
    };
    
    fetchStatus();
  }, [profileId]); // Runs only when `profileId` changes

  // Handle sending a connection request
  const handleSendConnection = async (toId: number) => {
    if (!user) return;

    try {
      const response = await sendConnectionRequest(toId);

      if (response) {
        if (response.ok) {
          alert("Connection request sent");
          setUser({ ...user, is_requested: true }); // Update user state to reflect request sent
        } else {
          const errorData = await response.json();
          alert(errorData.message || "Failed to send connection request");
        }
      }
    } catch (error) {
      console.error("Error sending connection request:", error);
    }
  };

  function buttonAction() {

  }

  // Render button based on user state
  return (
    <div>
      {user ? (
        <button
          onClick={() => handleSendConnection(user.id)}
          className={`px-4 py-2 border border-[#0a66c2] bg-transparent rounded-[25px] hover:bg-blue-50 focus:outline-none flex items-center space-x-2
            ${user.is_requested || user.is_requesting ? 'bg-gray-300 text-black border-black' : 'text-blue-500'}`}
        >
          {user.is_requested ? (
            <>
              <FaTimes/> <span>Cancel Request</span>
            </>
          ) : user.is_requesting ? (
            <>
              <FaConciergeBell /> <span>Requesting...</span>
            </>
          ) : user.is_connected ? (
            <>
              <FaUserTimes/> <span>Unconnect</span>
            </>
          ) : (
            <>
              <FaUserPlus/> <span>Connect</span>
            </>
          )}
        </button>
      ) : (
        <></>
      )}
    </div>
  );
}

//
function JobHistory({data} : {data : profileInterface | undefined}) {
  const editing = React.useContext(EditContext);
  const { formData, updateFormData } = useEditFormContext();

  const d = data != undefined ? (data) : (
    {
        username: "Username",
        name: "Name",
        work_history: "No Work",
        skills: "No skills",
        connection_count: 0,
        profile_photo: "pic"
    }
  )
  return (
    <section className="p-8 m-2 bg-white rounded-lg shadow-lg text-black">
      <h1 className="text-left">Job History</h1>
      {editing ? (
        <>
        <small>Job Title</small>
        <input
          name="jobTitle"
          value={formData.work_history || ""}
          onChange={(e) => {updateFormData("work_history", e.target.value)}}
          className="block w-full p-2 border rounded bg-white"
          placeholder="Enter job title" 
        />
        </>
      ) : (
        <h2 className="text-black text-2xl flex items-center p-8 m-2 border-b-2 border-t-2">
          {d.work_history}
        </h2>
      )}
    </section>
  )
}

function JobHistoryItem({work} : {work : string}) {
  const editing = React.useContext(EditContext);
  return (
    <div>
      <h2 className="text-black text-2xl flex items-center p-8 m-2 border-b-2 border-t-2">
        <img src="https://placehold.co/75x75.png" className='mr-2'/>
        {work}
      </h2>
    </div>
  )
}

function UserPosts() {

}

const EditProfileProvider: React.FC<{ children: React.ReactNode, initial_values: profileInterface }> = ({ children, initial_values }) => {
  const [formData, setFormData] = React.useState({
    username : initial_values.username,
    photo: undefined,
    name: initial_values.name,
    work_history: initial_values.work_history,
    skill: initial_values.skills,
  });

  const updateFormData = (name: string, value: string | File) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <EditFormContext.Provider value={{ formData, updateFormData }}>
      {children}
    </EditFormContext.Provider>
  );
};