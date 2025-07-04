import * as React from 'react';
import Post from './routes/-components/post';
import { getToken } from './api/auth';
/*
<div className = "w-[45%] mt-5">
      <CreatePost onPostCreated={fetchPosts} />
      {posts.map((post) => (
        <Post key={post.id} post={post} onPostUpdated={fetchPosts} />
      ))}
    </div>
*/
export interface PostData {
  id: number;
  profile_photo_path: string; // Path gambar profil
  username: string; // Nama pengguna
  user_id: number; // ID pengguna
  full_name: string; // Nama lengkap
  updated_at: string; // Waktu posting
  content: string; // Konten postingan
  is_editable?: boolean;
}

export const FeedsEngine: React.FC<{initialposts : PostData[], title?: string, onPostUpdate?: () => any}> = ({initialposts, title, onPostUpdate}) => {
  console.log("Bruh")
  console.log(initialposts);
  const [posts, setPosts] = React.useState<PostData[]>(initialposts);
  
  /*
  const fetchPosts = async () => {
    try {
      const token = getToken();
      const response = await fetch('http://localhost:3000/api/feed', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`, // Use the stored token
        },
      });
      const data = await response.json();
      setPosts(data.body); // Assuming the response contains posts in the `body` field
      console.log(posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  React.useEffect(() =>{
    fetchPosts()
  }, [])
  */

  return (
    <div className="p-8 m-2 bg-white rounded-lg shadow-lg text-left" id="feed-engine">
        <h1 className='text-black'>
            {title != null ? (title) : ("Posts")}
        </h1>
    {/* Posts */}
      {posts && posts.length > 0 ? (
        posts.map((post) => (<Post key={post.id} post={post} onPostUpdated={onPostUpdate? onPostUpdate() : null} />))
      ) : (
        <p>No posts available</p>
      )}
    {/* Pagination */}
    <Pagination/>
    </div>
  );
};

function Pagination() {
    return(
        <span className='text-center flex justify-evenly'>
            <button>Left</button><button>Right</button>
        </span>
    )
}

