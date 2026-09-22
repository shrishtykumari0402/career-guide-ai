"use client";

import { useState, useEffect, useMemo } from "react";
import {
  AlertTriangle,
  Download,
  Edit,
  Loader2,
  Monitor,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import MDEditor from "@uiw/react-md-editor";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { deleteResume, saveResume } from "@/actions/resume";
import { EntryForm } from "./entry-form";
import useFetch from "@/hooks/use-fetch";
import { useUser } from "@clerk/nextjs";
import { entriesToMarkdown } from "@/app/lib/helper";
import { pdf, Document, Page, Text, Link, View, StyleSheet } from "@react-pdf/renderer";

const RESUME_DRAFT_STORAGE_KEY = "career-guide-ai-resume-draft";

const defaultResumeValues = {
  contactInfo: {
    email: "",
    mobile: "",
    linkedin: "",
    github: "",
  },
  summary: "",
  skills: "",
  experience: [],
  education: [],
  projects: [],
};

const pdfStyles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, lineHeight: 1.35, color: "#111827" },
  name: { fontSize: 20, fontWeight: 700, marginBottom: 6 },
  contact: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 },
  section: { marginBottom: 12 },
  heading: { fontSize: 13, fontWeight: 700, marginBottom: 5 },
  entryTitle: { fontSize: 11, fontWeight: 700, marginTop: 5 },
  muted: { color: "#4b5563" },
  link: { color: "#2563eb", textDecoration: "underline" },
  bullet: { marginLeft: 10 },
});

const linkPattern = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;

const renderPdfText = (text, keyPrefix) => {
  const parts = [];
  let lastIndex = 0;
  let match;
  while ((match = linkPattern.exec(text || ""))) {
    if (match.index > lastIndex) parts.push(<Text key={`${keyPrefix}-text-${lastIndex}`}>{text.slice(lastIndex, match.index)}</Text>);
    parts.push(<Link key={`${keyPrefix}-link-${match.index}`} src={match[2]} style={pdfStyles.link}>{match[1]}</Link>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < (text || "").length) parts.push(<Text key={`${keyPrefix}-tail`}>{text.slice(lastIndex)}</Text>);
  return parts.length ? parts : text || "";
};

function ResumePdfDocument({ state, name }) {
  const contact = state.contactInfo || {};
  const sections = [
    ["Professional Summary", state.summary ? [state.summary] : []],
    ["Skills", state.skills ? [state.skills] : []],
    ["Work Experience", state.experience || []],
    ["Education", state.education || []],
    ["Projects", state.projects || []],
  ];

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Text style={pdfStyles.name}>{name || "Your Name"}</Text>
        <View style={pdfStyles.contact}>
          {contact.email && <Link src={`mailto:${contact.email}`} style={pdfStyles.link}>{contact.email}</Link>}
          {contact.mobile && <Text>{contact.mobile}</Text>}
          {contact.linkedin && <Link src={contact.linkedin} style={pdfStyles.link}>LinkedIn</Link>}
          {contact.github && <Link src={contact.github} style={pdfStyles.link}>GitHub</Link>}
        </View>
        {sections.map(([title, values]) => values.length > 0 && (
          <View key={title} style={pdfStyles.section}>
            <Text style={pdfStyles.heading}>{title}</Text>
            {title === "Professional Summary" || title === "Skills" ? (
              <Text>{renderPdfText(values[0], title)}</Text>
            ) : values.map((entry, index) => (
              <View key={`${title}-${index}`}>
                <Text style={pdfStyles.entryTitle}>{entry.title}{entry.organization ? ` | ${entry.organization}` : ""}</Text>
                <Text style={pdfStyles.muted}>{entry.current ? `${entry.startDate} - Present` : `${entry.startDate} - ${entry.endDate}`}</Text>
                {(entry.description || "").split(/\n+/).filter(Boolean).map((line, lineIndex) => (
                  <Text key={`${title}-${index}-${lineIndex}`} style={pdfStyles.bullet}>- {renderPdfText(line, `${title}-${index}-${lineIndex}`)}</Text>
                ))}
              </View>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  );
}

const markdownToResumeState = (content) => {
  if (!content) return null;
  const state = { ...defaultResumeValues, contactInfo: { ...defaultResumeValues.contactInfo } };
  const lines = content.split("\n");
  const nameLineIndex = lines.findIndex((line) => line.startsWith("# "));
  const contactLine = lines[nameLineIndex + 2] || "";
  contactLine.split("  |  ").forEach((part) => {
    const link = part.match(/^\[LinkedIn\]\((.+)\)$/);
    const github = part.match(/^\[GitHub\]\((.+)\)$/);
    if (part.includes("@")) state.contactInfo.email = part;
    else if (link) state.contactInfo.linkedin = link[1];
    else if (github) state.contactInfo.github = github[1];
    else if (part) state.contactInfo.mobile = part;
  });
  const entries = { "Work Experience": "experience", Education: "education", Projects: "projects" };
  let section = "";
  let entry = null;
  lines.slice(nameLineIndex + 2).forEach((line) => {
    const sectionMatch = line.match(/^## (.+)$/);
    if (sectionMatch) { section = sectionMatch[1]; entry = null; return; }
    if (section === "Professional Summary" && line.trim()) state.summary += `${state.summary ? "\n" : ""}${line.trim()}`;
    if (section === "Skills" && line.trim()) state.skills += `${state.skills ? "\n" : ""}${line.trim()}`;
    const entryMatch = line.match(/^### (.+?)(?: \| (.+))?$/);
    if (entryMatch && entries[section]) {
      entry = { title: entryMatch[1], organization: entryMatch[2] || "", startDate: "", endDate: "", description: "", current: false };
      state[entries[section]].push(entry);
      return;
    }
    if (entry) {
      const date = line.match(/<span class="resume-date">(.+?)<\/span>/);
      if (date) { const dates = date[1].split(" - "); entry.startDate = dates[0]; entry.current = dates[1] === "Present"; entry.endDate = entry.current ? "" : dates[1] || ""; }
      else if (line.startsWith("- ")) entry.description += `${entry.description ? "\n" : ""}${line.slice(2)}`;
    }
  });
  return state;
};

const getStoredDraft = () => {
  if (typeof window === "undefined") return null;

  try {
    const savedDraft = window.localStorage.getItem(RESUME_DRAFT_STORAGE_KEY);
    if (!savedDraft) return null;

    const parsed = JSON.parse(savedDraft);
    return {
      ...defaultResumeValues,
      ...parsed,
      contactInfo: {
        ...defaultResumeValues.contactInfo,
        ...(parsed?.contactInfo || {}),
      },
    };
  } catch (error) {
    console.error("Failed to restore resume draft:", error);
    return null;
  }
};

export default function ResumeBuilder({ initialContent }) {
  const [activeTab, setActiveTab] = useState("edit");
  const [savedContent, setSavedContent] = useState(initialContent || "");
  const { user } = useUser();
  const [resumeMode, setResumeMode] = useState("preview");
  const [resumeState, setResumeState] = useState(
    () => markdownToResumeState(initialContent) || getStoredDraft() || defaultResumeValues
  );

  const {
    loading: isSaving,
    fn: saveResumeFn,
    data: saveResult,
    error: saveError,
  } = useFetch(saveResume);

  const {
    loading: isDeleting,
    fn: deleteResumeFn,
  } = useFetch(deleteResume);

  useEffect(() => {
    if (initialContent) {
      const savedState = markdownToResumeState(initialContent);
      setSavedContent(initialContent);
      if (savedState) {
        setResumeState(savedState);
      }
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(RESUME_DRAFT_STORAGE_KEY);
      }
    } else {
      setSavedContent("");
    }
  }, [initialContent]);

  useEffect(() => {
    if (initialContent) return;
    const storedDraft = getStoredDraft();
    if (storedDraft) {
      setResumeState(storedDraft);
    }
  }, [initialContent]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        RESUME_DRAFT_STORAGE_KEY,
        JSON.stringify(resumeState)
      );
    }
  }, [resumeState]);

  useEffect(() => {
    if (saveResult && !isSaving) {
      toast.success("Resume saved successfully!");
      setSavedContent(saveResult.content);
    }
    if (saveError) {
      toast.error(saveError.message || "Failed to save resume");
    }
  }, [saveResult, saveError, isSaving]);

  const updateResumeState = (updater) => {
    setResumeState((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      return next;
    });
  };

  const getContactMarkdown = (state) => {
    const contactInfo = state.contactInfo || {};
    const parts = [];
    if (contactInfo.email) parts.push(contactInfo.email);
    if (contactInfo.mobile) parts.push(contactInfo.mobile);
    if (contactInfo.linkedin) parts.push(`[LinkedIn](${contactInfo.linkedin})`);
    if (contactInfo.github) parts.push(`[GitHub](${contactInfo.github})`);

    return parts.length > 0
      ? `# ${user?.fullName || "Your Name"}\n\n${parts.join("  |  ")}`
      : `# ${user?.fullName || "Your Name"}`;
  };

  const getCombinedContent = (state) => {
    const { summary, skills, experience, education, projects } = state;
    const skillList = skills
      ?.split(/,|\n/)
      .map((skill) => skill.trim())
      .filter(Boolean);

    return [
      getContactMarkdown(state),
      summary && `## Professional Summary\n\n${summary}`,
      skillList?.length && `## Skills\n\n${skillList.join("  |  ")}`,
      entriesToMarkdown(experience, "Work Experience"),
      entriesToMarkdown(education, "Education"),
      entriesToMarkdown(projects, "Projects"),
    ]
      .filter(Boolean)
      .join("\n\n");
  };

  const previewContent = useMemo(
    () => getCombinedContent(resumeState),
    [resumeState, user?.fullName]
  );

  const handleDeleteResume = async () => {
    if (!window.confirm("Delete your saved resume? This cannot be undone.")) return;

    const result = await deleteResumeFn();
    if (!result?.success) return;
    setSavedContent("");
    setResumeState(defaultResumeValues);
    setActiveTab("edit");
    setResumeMode("preview");
    window.localStorage.removeItem(RESUME_DRAFT_STORAGE_KEY);
    toast.success("Saved resume deleted");
  };

  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const blob = await pdf(
        <ResumePdfDocument state={resumeState} name={user?.fullName} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "resume.pdf";
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Resume downloaded successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error(error.message || "Failed to download resume PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async () => {
    try {
      const formattedContent = (previewContent || "")
        .replace(/\n\s*\n/g, "\n\n")
        .trim();

      await saveResumeFn(formattedContent);
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  const handleSave = () => onSubmit();

  return (
    <div data-color-mode="light" className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-2">
        <h1 className="font-bold gradient-title text-5xl md:text-6xl">
          Resume Builder
        </h1>
        <div className="flex flex-wrap justify-center gap-2">
          {savedContent && (
            <>
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setActiveTab("preview");
                  setResumeMode("preview");
                }}
              >
                <Monitor className="mr-2 h-4 w-4" />
                View saved resume
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setActiveTab("edit");
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit saved resume
              </Button>
            </>
          )}
          <Button
            variant="destructive"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save
              </>
            )}
          </Button>
          {savedContent && (
            <Button onClick={generatePDF} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download PDF
                </>
              )}
            </Button>
          )}
          {savedContent && (
            <Button
              variant="outline"
              type="button"
              className="text-destructive hover:text-destructive"
              onClick={handleDeleteResume}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete saved resume
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="edit">Form</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="edit">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit();
            }}
            className="space-y-8"
          >
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={resumeState.contactInfo.email}
                    onChange={(event) =>
                      updateResumeState((current) => ({
                        ...current,
                        contactInfo: {
                          ...current.contactInfo,
                          email: event.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mobile Number</label>
                  <Input
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={resumeState.contactInfo.mobile}
                    onChange={(event) =>
                      updateResumeState((current) => ({
                        ...current,
                        contactInfo: {
                          ...current.contactInfo,
                          mobile: event.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">LinkedIn URL</label>
                  <Input
                    type="url"
                    placeholder="https://linkedin.com/in/your-profile"
                    value={resumeState.contactInfo.linkedin}
                    onChange={(event) =>
                      updateResumeState((current) => ({
                        ...current,
                        contactInfo: {
                          ...current.contactInfo,
                          linkedin: event.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">GitHub Profile</label>
                  <Input
                    type="url"
                    placeholder="https://github.com/your-username"
                    value={resumeState.contactInfo.github}
                    onChange={(event) =>
                      updateResumeState((current) => ({
                        ...current,
                        contactInfo: {
                          ...current.contactInfo,
                          github: event.target.value,
                        },
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Professional Summary</h3>
              <Textarea
                className="h-32"
                placeholder="Write a compelling professional summary..."
                value={resumeState.summary}
                onChange={(event) =>
                  updateResumeState((current) => ({
                    ...current,
                    summary: event.target.value,
                  }))
                }
              />
            </div>

            {/* Skills */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Skills</h3>
              <Textarea
                className="h-32"
                placeholder="List your key skills..."
                value={resumeState.skills}
                onChange={(event) =>
                  updateResumeState((current) => ({
                    ...current,
                    skills: event.target.value,
                  }))
                }
              />
            </div>

            {/* Experience */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Work Experience</h3>
              <EntryForm
                type="Experience"
                entries={resumeState.experience}
                onChange={(entries) =>
                  updateResumeState((current) => ({
                    ...current,
                    experience: entries,
                  }))
                }
              />
            </div>

            {/* Education */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Education</h3>
              <EntryForm
                type="Education"
                entries={resumeState.education}
                onChange={(entries) =>
                  updateResumeState((current) => ({
                    ...current,
                    education: entries,
                  }))
                }
              />
            </div>

            {/* Projects */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Projects</h3>
              <EntryForm
                type="Project"
                entries={resumeState.projects}
                onChange={(entries) =>
                  updateResumeState((current) => ({
                    ...current,
                    projects: entries,
                  }))
                }
              />
            </div>
          </form>
        </TabsContent>

        <TabsContent value="preview">
          {activeTab === "preview" && (
            <Button
              variant="link"
              type="button"
              className="mb-2"
              onClick={() =>
                setResumeMode(resumeMode === "preview" ? "edit" : "preview")
              }
            >
              {resumeMode === "preview" ? (
                <>
                  <Edit className="h-4 w-4" />
                  Edit Saved Resume
                </>
              ) : (
                <>
                  <Monitor className="h-4 w-4" />
                  Show Preview
                </>
              )}
            </Button>
          )}

          {activeTab === "preview" && resumeMode !== "preview" && (
            <div className="flex p-3 gap-2 items-center border-2 border-yellow-600 text-yellow-600 rounded mb-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm">
                You will lose editied markdown if you update the form data.
              </span>
            </div>
          )}
          {resumeMode === "preview" ? (
            <div className="resume-preview-shell">
              <div className="resume-document" id="resume-preview">
                <MDEditor.Markdown source={previewContent || "# Your Name"} />
              </div>
            </div>
          ) : (
            <div className="resume-preview-shell">
              <div className="resume-document" id="resume-preview-formatted">
                <MDEditor.Markdown source={previewContent || "# Your Name"} />
              </div>
            </div>
          )}
          <div style={{ position: "absolute", left: "-9999px" }}>
            <div className="resume-document resume-pdf-document" id="resume-pdf">
              <MDEditor.Markdown source={previewContent || "# Your Name"} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
