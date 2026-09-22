"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Download, Edit2, Loader2, X } from "lucide-react";
import MDEditor from "@uiw/react-md-editor";
import ReactMarkdown from "react-markdown";
import html2pdf from "html2pdf.js/dist/html2pdf.min.js";
import { Button } from "@/components/ui/button";
import { updateCoverLetter } from "@/actions/cover-letter";
import { toast } from "sonner";

const sanitizeCoverLetterContent = (text) => {
  if (!text) return "";

  return String(text)
    .replace(/```(?:markdown|md)?\s*/gi, "")
    .replace(/```/g, "")
    .trim();
};

const CoverLetterPreview = ({ id, content }) => {
  const router = useRouter();
  const [value, setValue] = useState(sanitizeCoverLetterContent(content));
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    setValue(sanitizeCoverLetterContent(content));
  }, [content]);

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

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const element = document.getElementById("cover-letter-pdf");
      if (!element) {
        throw new Error("Cover letter preview not found");
      }

      await html2pdf()
        .set({
          margin: [12, 12],
          filename: "cover-letter.pdf",
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(element)
        .save();

      toast.success("Cover letter downloaded successfully!");
    } catch (error) {
      console.error("Cover letter PDF error:", error);
      toast.error(error.message || "Failed to download cover letter");
    } finally {
      setIsDownloading(false);
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
          <>
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit cover letter
            </Button>
            <Button onClick={handleDownload} disabled={isDownloading}>
              {isDownloading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Download PDF
            </Button>
          </>
        )}
      </div>

      {isEditing ? (
        <div className="overflow-hidden rounded-lg border">
          <MDEditor value={value} onChange={(nextValue) => setValue(nextValue || "")} preview="edit" height={700} />
        </div>
      ) : (
        <>
          <div className="cover-letter-paper">
            <div className="cover-letter-render">
              <ReactMarkdown>{sanitizeCoverLetterContent(value)}</ReactMarkdown>
            </div>
          </div>
          <div style={{ position: "absolute", left: "-9999px" }}>
            <div id="cover-letter-pdf" className="cover-letter-paper cover-letter-pdf-document">
              <div className="cover-letter-render">
                <ReactMarkdown>{sanitizeCoverLetterContent(value)}</ReactMarkdown>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CoverLetterPreview;
