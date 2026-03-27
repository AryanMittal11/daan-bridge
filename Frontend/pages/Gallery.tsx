import React, { useState, useEffect } from 'react';
import { useApp } from '../context';
import { Card, Button, Modal, Input } from '../components/UI';
import { Heart, MessageCircle, Share2, Upload, Image as ImageIcon, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import API from '../api';

export const Gallery = () => {
  const { user } = useApp();
  const [posts, setPosts] = useState<any[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({ caption: '', image: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [editingPost, setEditingPost] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await API.get('/gallery');
      setPosts(res.data);
    } catch (err) {
      console.error("Failed to fetch gallery posts:", err);
    }
  };

  const handleUpload = async () => {
    try {
      setUploading(true);
      let imageUrl = uploadForm.image || 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=800';
      
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const { data: uploadData } = await API.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        imageUrl = uploadData.url;
      }

      const payload = {
         caption: uploadForm.caption,
         image: imageUrl
      };
      await API.post('/gallery', payload);
      fetchPosts();
      setShowUploadModal(false);
      setUploadForm({ caption: '', image: '' });
      setImageFile(null);
    } catch (err) {
      console.error("Failed to upload post:", err);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const res = await API.post(`/gallery/${postId}/like`);
      // Update state
      setPosts(posts.map(p => {
        if (p.id === postId) {
          const isCurrentlyLiked = p.likedBy?.some((u: any) => u.id === user?.id);
          const newLikedBy = isCurrentlyLiked 
              ? p.likedBy.filter((u: any) => u.id !== user?.id)
              : [...(p.likedBy || []), { id: user?.id }];
          return { ...p, likedBy: newLikedBy };
        }
        return p;
      }));
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await API.delete(`/gallery/${postId}`);
      fetchPosts();
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  };

  const handleEditSubmit = async () => {
    if (!editingPost) return;
    try {
      await API.put(`/gallery/${editingPost.id}`, { caption: editingPost.caption });
      fetchPosts();
      setEditingPost(null);
    } catch (err) {
      console.error("Failed to update post:", err);
    }
  };

  const isOwner = (postUserId: string) => {
    return user && user.id === postUserId;
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? 'Just now' : d.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Impact Gallery</h1>
          <p className="text-slate-500 dark:text-slate-400">Share your stories, successful donations, and volunteer moments.</p>
        </div>
        <Button onClick={() => setShowUploadModal(true)} className="flex items-center gap-2">
          <Upload size={18} /> Upload Photo
        </Button>
      </div>

      {/* Gallery Grid */}
      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {posts.map(post => (
          <Card key={post.id} className="break-inside-avoid mb-6 overflow-visible">
             <div className="p-4 flex items-center justify-between relative">
                <div className="flex items-center gap-3">
                   <img src={post.user?.avatar || 'https://i.pravatar.cc/150'} alt={post.user?.name || 'Anonymous'} className="w-8 h-8 rounded-full object-cover" />
                   <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">{post.user?.name || 'Anonymous'}</p>
                      <p className="text-[10px] text-slate-500">{formatDate(post.createdAt)} • {post.user?.role || 'INDIVIDUAL'}</p>
                   </div>
                </div>
                {isOwner(post.userId) && (
                  <div className="relative">
                    <button 
                      onClick={() => setShowDropdown(showDropdown === post.id ? null : post.id)}
                      className="text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    {showDropdown === post.id && (
                      <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10">
                        <button 
                          onClick={() => {
                            setEditingPost(post);
                            setShowDropdown(null);
                          }}
                          className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        >
                          <Edit size={14} /> Edit
                        </button>
                        <button 
                          onClick={() => {
                            handleDelete(post.id);
                            setShowDropdown(null);
                          }}
                          className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
             </div>
             <div className="relative aspect-auto">
                <img src={post.image} alt="Post" className="w-full h-auto object-cover" />
             </div>
             <div className="p-4">
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 whitespace-pre-wrap">{post.caption}</p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                   <div className="flex gap-4">
                      <button 
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-1 transition-colors ${
                          post.likedBy?.some((u: any) => u.id === user?.id) 
                            ? 'text-red-500' 
                            : 'text-slate-500 hover:text-red-500'
                        }`}
                      >
                         <Heart 
                           size={20} 
                           fill={post.likedBy?.some((u: any) => u.id === user?.id) ? "currentColor" : "none"} 
                         />
                         <span className="text-sm">{post.likedBy?.length || 0}</span>
                      </button>
                      <button className="flex items-center gap-1 text-slate-500 hover:text-primary-500 transition-colors">
                         <MessageCircle size={20} />
                      </button>
                   </div>
                   <button className="text-slate-500 hover:text-blue-500 transition-colors">
                      <Share2 size={20} />
                   </button>
                </div>
             </div>
          </Card>
        ))}
      </div>

      {/* Upload Modal */}
      <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} title="Share Your Impact">
         <div className="space-y-4">
             <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl h-48 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative overflow-hidden">
                {uploadForm.image ? (
                   <img src={uploadForm.image} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                   <>
                     <ImageIcon size={48} className="text-slate-300 mb-2" />
                     <p className="text-sm font-medium text-slate-500">Click to select photo</p>
                   </>
                )}
                <input 
                   type="file" 
                   accept="image/*"
                   className="absolute inset-0 opacity-0 cursor-pointer" 
                   onChange={(e) => {
                       if(e.target.files && e.target.files[0]) {
                           const file = e.target.files[0];
                           setImageFile(file);
                           const previewUrl = URL.createObjectURL(file);
                           setUploadForm({...uploadForm, image: previewUrl});
                       }
                   }} 
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Caption / Thought</label>
                <textarea 
                   className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none h-24 resize-none"
                   placeholder="Share your experience, a thought about this moment, or tag people..."
                   value={uploadForm.caption}
                   onChange={e => setUploadForm({...uploadForm, caption: e.target.value})}
                ></textarea>
             </div>
             <Button className="w-full" onClick={handleUpload} disabled={!uploadForm.caption || uploading}>
               {uploading ? 'Uploading...' : 'Post to Gallery'}
             </Button>
         </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editingPost} onClose={() => setEditingPost(null)} title="Edit Post">
         <div className="space-y-4">
             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Caption / Thought</label>
                <textarea 
                   className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none h-24 resize-none"
                   placeholder="Share your experience..."
                   value={editingPost?.caption || ''}
                   onChange={e => setEditingPost({...editingPost, caption: e.target.value})}
                ></textarea>
             </div>
             <div className="flex gap-2">
               <Button className="w-full bg-slate-200 text-slate-800 hover:bg-slate-300" onClick={() => setEditingPost(null)}>Cancel</Button>
               <Button className="w-full" onClick={handleEditSubmit} disabled={!editingPost?.caption}>Save Changes</Button>
             </div>
         </div>
      </Modal>
    </div>
  );
};
