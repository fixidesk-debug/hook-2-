import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Image, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface MediaUploadProps {
  onMediaSent: (mediaUrl: string) => void;
}

export const MediaUpload: React.FC<MediaUploadProps> = ({ onMediaSent }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const { user } = useAuth();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large (max 5MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadMedia = async (file: File) => {
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `chat/${user.id}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('chat-media')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('chat-media')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSend = async () => {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = fileInput?.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const mediaUrl = await uploadMedia(file);
      if (mediaUrl) {
        onMediaSent(mediaUrl);
        setPreview(null);
        fileInput.value = '';
      }
    } catch (error) {
      toast.error('Failed to upload media');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {preview ? (
        <div className="flex items-center gap-2 bg-gray-100 p-2 border-2 border-black">
          <img src={preview} alt="Preview" className="w-12 h-12 object-cover border border-black" />
          <Button
            onClick={handleSend}
            disabled={isUploading}
            className="bg-brutal-green text-black font-black border-2 border-black px-3 py-1 text-sm"
          >
            {isUploading ? 'SENDING...' : 'SEND'}
          </Button>
          <Button
            onClick={() => setPreview(null)}
            className="bg-red-500 text-white border-2 border-black p-1"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            className="bg-gray-300 text-black border-2 border-black p-2"
          >
            <Image className="h-4 w-4" />
          </Button>
        </label>
      )}
    </div>
  );
};