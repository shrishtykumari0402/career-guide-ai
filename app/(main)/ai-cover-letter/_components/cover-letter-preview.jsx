"use client";

import React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Edit2, Loader2, X } from "lucide-react";
import MDEditor from "@uiw/react-md-editor";
import { Button } from "@/components/ui/button";
import { updateCoverLetter } from "@/actions/cover-letter";
import { toast } from "sonner";

const CoverLetterPreview = ({ id, content }) => {
  const router = useRouter();
  const [value, setValue] = useState(content || "");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!value.trim()) {
      toast.error("Cover letter content cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      await updateCoverLetter(id, value);
      setIsEditing(false);
      toast.success("Cover letter updated successfully");
      router.refresh();
    } catch (error) {
      toast.error(error.message || "Failed to update cover letter");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-3 py-4">
      <div className="flex flex-wrap justify-end gap-2">
        {isEditing ? (
          <>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Save changes
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit2 className="mr-2 h-4 w-4" />
            Edit cover letter
          </Button>
        )}
      </div>
      <div className={isEditing ? "overflow-hidden rounded-lg border" : "cover-letter-paper"}>
        {isEditing ? (
          <MDEditor value={value} onChange={(nextValue) => setValue(nextValue || "")} preview="edit" height={700} />
        ) : (
          <MDEditor.Markdown source={value} />
        )}
      </div>
    </div>
  );
};

export default CoverLetterPreview;
