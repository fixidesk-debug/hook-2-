import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit3, Save, LogOut, Users, User, UsersIcon, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  type: 'solo' | 'couple' | 'group';
  age: number;
  gender_orientation: string;
  bio: string;
  location: string;
  tags: string[];
  photos: string[];
  privacy_settings: any;
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    setIsLoading(true);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      toast.error("Error loading profile");
    } else {
      setProfile(data);
      setFormData(data);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!user || !profile) return;

    setIsSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update(formData)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating profile:', error);
      toast.error("Error updating profile");
    } else {
      setProfile({ ...profile, ...formData });
      setIsEditing(false);
      toast.success("Profile updated!");
    }
    setIsSaving(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploadingPhoto(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(fileName, file);

    if (uploadError) {
      toast.error("Error uploading photo");
      setUploadingPhoto(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(fileName);

    const newPhotos = [...(profile.photos || []), publicUrl];
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ photos: newPhotos })
      .eq('user_id', user.id);

    if (updateError) {
      toast.error('Error saving photo');
    } else {
      setProfile(prev => prev ? { ...prev, photos: newPhotos } : null);
      setFormData(prev => ({ ...prev, photos: newPhotos }));
      toast.success('Photo uploaded!');
    }
    
    setUploadingPhoto(false);
  };

  const removePhoto = async (index: number) => {
    const newPhotos = (profile.photos || []).filter((_, i) => i !== index);
    
    const { error } = await supabase
      .from('profiles')
      .update({ photos: newPhotos })
      .eq('user_id', user.id);

    if (error) {
      toast.error('Error removing photo');
    } else {
      setProfile(prev => prev ? { ...prev, photos: newPhotos } : null);
      setFormData(prev => ({ ...prev, photos: newPhotos }));
      toast.success('Photo removed!');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'couple': return <UsersIcon className="h-6 w-6" />;
      case 'group': return <Users className="h-6 w-6" />;
      default: return <User className="h-6 w-6" />;
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTagsChange = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
    handleInputChange('tags', tags);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black mb-4">PLEASE LOG IN</h1>
          <p className="text-lg">You need to be logged in to view your profile</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black mb-4">LOADING PROFILE...</h1>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black mb-4">PROFILE NOT FOUND</h1>
          <Button onClick={fetchProfile} className="bg-brutal-pink text-black font-black">
            RETRY
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b-4 border-black bg-white p-4">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <h1 className="text-3xl font-black">YOUR PROFILE</h1>
          <div className="flex gap-2">
            {!isEditing ? (
              <Button 
                onClick={() => setIsEditing(true)}
                className="bg-brutal-green text-black font-black border-4 border-black"
              >
                <Edit3 className="h-5 w-5 mr-2" />
                EDIT
              </Button>
            ) : (
              <>
                <Button 
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-300 text-black font-black border-4 border-black"
                >
                  CANCEL
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-brutal-green text-black font-black border-4 border-black"
                >
                  <Save className="h-5 w-5 mr-2" />
                  {isSaving ? 'SAVING...' : 'SAVE'}
                </Button>
              </>
            )}
            <Button 
              onClick={handleLogout}
              className="bg-red-500 text-white font-black border-4 border-black hover:bg-red-600"
            >
              <LogOut className="h-5 w-5 mr-2" />
              LOGOUT
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border-4 border-black shadow-brutal">
            {/* Profile Photos */}
            <div className="bg-brutal-blue border-b-4 border-black p-8">
              <div className="text-center mb-4">
                <div className="flex items-center justify-center gap-2 text-white mb-4">
                  {getTypeIcon(profile.type)}
                  <h2 className="text-3xl font-black">{profile.username.toUpperCase()}</h2>
                </div>
              </div>
              
              {/* Photo Gallery */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
                {(profile.photos || []).map((photo, index) => (
                  <div key={index} className="relative">
                    <img 
                      src={photo} 
                      alt={`Profile ${index + 1}`}
                      className="w-full h-24 md:h-32 object-cover border-2 md:border-4 border-black cursor-pointer hover:opacity-80"
                      onClick={() => window.open(photo, '_blank')}
                    />
                    {isEditing && (
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 border-2 border-black"
                      >
                        <X className="h-3 w-3 md:h-4 md:w-4" />
                      </button>
                    )}
                  </div>
                ))}
                
                {isEditing && (profile.photos || []).length < 6 && (
                  <div className="border-2 md:border-4 border-dashed border-white h-24 md:h-32 flex items-center justify-center">
                    <label className="cursor-pointer text-white font-black text-center">
                      <Upload className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-1 md:mb-2" />
                      <div className="text-xs md:text-sm">
                        {uploadingPhoto ? 'UPLOADING...' : 'ADD PHOTO'}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        disabled={uploadingPhoto}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
                
                {(!profile.photos || profile.photos.length === 0) && !isEditing && (
                  <div className="col-span-2 md:col-span-3 text-center">
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-white border-2 md:border-4 border-black mx-auto flex items-center justify-center">
                      <span className="text-4xl md:text-6xl font-black text-brutal-blue">
                        {profile.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Details */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-black mb-2 block">USERNAME</Label>
                  {isEditing ? (
                    <Input
                      value={formData.username || ''}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      className="border-4 border-black font-bold"
                    />
                  ) : (
                    <p className="font-bold text-lg">{profile.username}</p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-black mb-2 block">AGE</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={formData.age || ''}
                      onChange={(e) => handleInputChange('age', parseInt(e.target.value))}
                      className="border-4 border-black font-bold"
                    />
                  ) : (
                    <p className="font-bold text-lg">{profile.age}</p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-black mb-2 block">TYPE</Label>
                  {isEditing ? (
                    <select
                      value={formData.type || 'solo'}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="w-full p-2 border-4 border-black font-bold"
                    >
                      <option value="solo">SOLO</option>
                      <option value="couple">COUPLE</option>
                      <option value="group">GROUP</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-2">
                      {getTypeIcon(profile.type)}
                      <span className="bg-brutal-green text-black px-2 py-1 font-black text-sm border-2 border-black">
                        {profile.type.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-black mb-2 block">LOCATION</Label>
                  {isEditing ? (
                    <Input
                      value={formData.location || ''}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="border-4 border-black font-bold"
                    />
                  ) : (
                    <p className="font-bold text-lg">{profile.location || 'Not specified'}</p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-black mb-2 block">GENDER/ORIENTATION</Label>
                {isEditing ? (
                  <Input
                    value={formData.gender_orientation || ''}
                    onChange={(e) => handleInputChange('gender_orientation', e.target.value)}
                    className="border-4 border-black font-bold"
                  />
                ) : (
                  <p className="font-bold text-lg">{profile.gender_orientation || 'Not specified'}</p>
                )}
              </div>

              <div>
                <Label className="text-sm font-black mb-2 block">BIO</Label>
                {isEditing ? (
                  <Textarea
                    value={formData.bio || ''}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    className="border-4 border-black font-bold min-h-[100px]"
                    placeholder="Tell people about yourself..."
                  />
                ) : (
                  <p className="font-bold text-lg">{profile.bio || 'No bio yet'}</p>
                )}
              </div>

              <div>
                <Label className="text-sm font-black mb-2 block">INTERESTS (comma separated)</Label>
                {isEditing ? (
                  <Input
                    value={formData.tags?.join(', ') || ''}
                    onChange={(e) => handleTagsChange(e.target.value)}
                    className="border-4 border-black font-bold"
                    placeholder="music, sports, art, travel..."
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {profile.tags.length > 0 ? (
                      profile.tags.map((tag, index) => (
                        <span key={index} className="bg-gray-200 text-black px-2 py-1 text-sm font-bold border-2 border-black">
                          #{tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 font-bold">No interests yet</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}