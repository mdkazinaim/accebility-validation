import DynamicTable, { Column } from "@/common/DynamicTable/DynamicTable";
import {
  Pencil,
  Trash2,
  Eye,
  Download,
  Share2,
  FileText,
  Image as ImageIcon,
  FileCode,
  FileVideo,
  File as FileIcon,
} from "lucide-react";
import { StatusPill } from "@/common/DynamicTable/TableComponents";
import { Avatar, AvatarStack } from "@/common/Avatar";

// ============================================
// 📦 Types
// ============================================

interface ProjectFile extends Record<string, unknown> {
  id: string;
  name: string;
  type: string;
  taskLink: string;
  addedBy: { name: string; avatar?: string };
  assignStaff: { name: string; avatar?: string }[];
  priority: "High" | "Medium" | "Low";
  dueDate: string;
  level: "High" | "Medium" | "Low";
  fileSize: string;
  attachments?: number;
  comments?: number;
}

// ============================================
// 🎯 Premium Table Example (Matches Images)
// ============================================

const AdvancedTableExample = () => {
  const files: ProjectFile[] = [
    {
      id: "1",
      name: "photo_2025-07-22_03-26-36.jpg",
      type: "JPG Image",
      taskLink: "Planning",
      addedBy: { name: "Mike Smith", avatar: "https://i.pravatar.cc/150?u=1" },
      assignStaff: [
        { name: "User 1", avatar: "https://i.pravatar.cc/150?u=10" },
        { name: "User 2", avatar: "https://i.pravatar.cc/150?u=11" },
        { name: "User 3", avatar: "https://i.pravatar.cc/150?u=12" },
        { name: "User 4" },
        { name: "User 5" },
        { name: "User 6" },
        { name: "User 7" },
        { name: "User 8" },
      ],
      priority: "High",
      dueDate: "24-7-2024",
      level: "Low",
      fileSize: "70.47 KB",
      attachments: 4,
      comments: 4,
    },
    {
      id: "2",
      name: "blue_print_theta_analyzer.pdf",
      type: "PDF",
      taskLink: "Plinth beam",
      addedBy: {
        name: "Jennifer Jones",
        avatar: "https://i.pravatar.cc/150?u=2",
      },
      assignStaff: [
        { name: "User 1", avatar: "https://i.pravatar.cc/150?u=13" },
        { name: "User 2", avatar: "https://i.pravatar.cc/150?u=14" },
      ],
      priority: "Medium",
      dueDate: "24-7-2024",
      level: "Medium",
      fileSize: "70.47 KB",
    },
    {
      id: "3",
      name: "LMI-PolicyComparisonReport - Home.xlsx",
      type: "Excel Worksheet",
      taskLink: "1st Floor Slab",
      addedBy: { name: "Sam Watson", avatar: "https://i.pravatar.cc/150?u=3" },
      assignStaff: [
        { name: "User 1", avatar: "https://i.pravatar.cc/150?u=15" },
        { name: "User 2", avatar: "https://i.pravatar.cc/150?u=16" },
        { name: "User 3", avatar: "https://i.pravatar.cc/150?u=17" },
      ],
      priority: "Low",
      dueDate: "24-7-2024",
      level: "High",
      fileSize: "70.47 KB",
      attachments: 8,
      comments: 8,
    },
    {
      id: "4",
      name: "Services Page.docx",
      type: "Word Document",
      taskLink: "2nd Floor Slab",
      addedBy: { name: "Sam Watson", avatar: "https://i.pravatar.cc/150?u=3" },
      assignStaff: [
        { name: "User 1", avatar: "https://i.pravatar.cc/150?u=18" },
      ],
      priority: "High",
      dueDate: "24-7-2024",
      level: "Medium",
      fileSize: "70.47 KB",
    },
    {
      id: "5",
      name: "Transit Authority - New Permitting Requirements",
      type: "Change",
      taskLink: "Finishing Plan",
      addedBy: { name: "Mike Smith", avatar: "https://i.pravatar.cc/150?u=1" },
      assignStaff: [
        { name: "User 1", avatar: "https://i.pravatar.cc/150?u=19" },
        { name: "User 2", avatar: "https://i.pravatar.cc/150?u=20" },
        { name: "User 3", avatar: "https://i.pravatar.cc/150?u=21" },
      ],
      priority: "High",
      dueDate: "24-7-2024",
      level: "Low",
      fileSize: "70.47 MB",
      attachments: 2,
      comments: 2,
    },
    {
      id: "6",
      name: "marketing_strategy_2025.pdf",
      type: "PDF",
      taskLink: "Strategy",
      addedBy: { name: "Mike Smith", avatar: "https://i.pravatar.cc/150?u=1" },
      assignStaff: [{ name: "User 4" }],
      priority: "Medium",
      dueDate: "25-7-2024",
      level: "Medium",
      fileSize: "2.5 MB",
    },
    {
      id: "7",
      name: "client_feedback_summary.docx",
      type: "Word Document",
      taskLink: "Review",
      addedBy: {
        name: "Jennifer Jones",
        avatar: "https://i.pravatar.cc/150?u=2",
      },
      assignStaff: [{ name: "User 2" }],
      priority: "Low",
      dueDate: "26-7-2024",
      level: "Low",
      fileSize: "15 KB",
    },
    {
      id: "8",
      name: "site_survey_images.zip",
      type: "Archive",
      taskLink: "Site Analysis",
      addedBy: { name: "Sam Watson", avatar: "https://i.pravatar.cc/150?u=3" },
      assignStaff: [{ name: "User 3" }],
      priority: "High",
      dueDate: "27-7-2024",
      level: "High",
      fileSize: "124 MB",
    },
    {
      id: "9",
      name: "budget_proposal_final.xlsx",
      type: "Excel",
      taskLink: "Finance",
      addedBy: { name: "Mike Smith", avatar: "https://i.pravatar.cc/150?u=1" },
      assignStaff: [{ name: "User 1" }],
      priority: "High",
      dueDate: "28-7-2024",
      level: "Medium",
      fileSize: "1.2 MB",
    },
    {
      id: "10",
      name: "interior_design_mockups.png",
      type: "Image",
      taskLink: "Staging",
      addedBy: {
        name: "Jennifer Jones",
        avatar: "https://i.pravatar.cc/150?u=2",
      },
      assignStaff: [{ name: "User 5" }],
      priority: "Medium",
      dueDate: "29-7-2024",
      level: "Low",
      fileSize: "4.8 MB",
    },
    {
      id: "11",
      name: "structural_audit_v2.pdf",
      type: "PDF",
      taskLink: "Audit",
      addedBy: { name: "Sam Watson", avatar: "https://i.pravatar.cc/150?u=3" },
      assignStaff: [{ name: "User 2" }],
      priority: "Low",
      dueDate: "30-7-2024",
      level: "High",
      fileSize: "3.1 MB",
    },
    {
      id: "12",
      name: "electrical_plans.dwg",
      type: "CAD",
      taskLink: "Wiring",
      addedBy: { name: "Mike Smith", avatar: "https://i.pravatar.cc/150?u=1" },
      assignStaff: [{ name: "User 4" }],
      priority: "High",
      dueDate: "01-8-2024",
      level: "Low",
      fileSize: "45 MB",
    },
    {
      id: "13",
      name: "safety_protocols_2024.pdf",
      type: "PDF",
      taskLink: "Compliance",
      addedBy: {
        name: "Jennifer Jones",
        avatar: "https://i.pravatar.cc/150?u=2",
      },
      assignStaff: [{ name: "User 1" }],
      priority: "Medium",
      dueDate: "02-8-2024",
      level: "Medium",
      fileSize: "1.1 MB",
    },
    {
      id: "14",
      name: "landscape_concept.jpg",
      type: "Image",
      taskLink: "Garden",
      addedBy: { name: "Sam Watson", avatar: "https://i.pravatar.cc/150?u=3" },
      assignStaff: [{ name: "User 3" }],
      priority: "Low",
      dueDate: "03-8-2024",
      level: "Low",
      fileSize: "2.2 MB",
    },
    {
      id: "15",
      name: "contract_draft_v1.docx",
      type: "Word Document",
      taskLink: "Legal",
      addedBy: { name: "Mike Smith", avatar: "https://i.pravatar.cc/150?u=1" },
      assignStaff: [{ name: "User 5" }],
      priority: "High",
      dueDate: "04-8-2024",
      level: "High",
      fileSize: "95 KB",
    },
  ];

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif"].includes(ext || ""))
      return <ImageIcon className="h-4 w-4 text-blue-500" />;
    if (["pdf"].includes(ext || ""))
      return <FileText className="h-4 w-4 text-rose-500" />;
    if (["xlsx", "xls", "csv"].includes(ext || ""))
      return <FileCode className="h-4 w-4 text-emerald-500" />;
    if (["docx", "doc"].includes(ext || ""))
      return <FileIcon className="h-4 w-4 text-blue-600" />;
    if (["mp4", "mov", "avi"].includes(ext || ""))
      return <FileVideo className="h-4 w-4 text-amber-500" />;
    return <FileIcon className="h-4 w-4 text-gray-400" />;
  };

  const columns: Column<ProjectFile>[] = [
    {
      key: "name",
      label: "File Name",
      width: "120px",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-light-background rounded-lg group-hover:scale-110 transition-transform border border-border">
            {getFileIcon(row.name)}
          </div>
          <span className="truncate max-w-[220px]">{row.name}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "taskLink",
      label: "Task Link",
      accessor: "taskLink",
      sortable: true,
    },
    {
      key: "addedBy",
      label: "Added By",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Avatar src={row.addedBy.avatar} name={row.addedBy.name} size="md" />
          <span className="text-primary-text">{row.addedBy.name}</span>
        </div>
      ),
    },
    {
      key: "assignStaff",
      label: "Assign Staff",
      render: (row) => (
        <AvatarStack users={row.assignStaff} limit={3} size="md" />
      ),
      showTooltip: false,
    },
    {
      key: "priority",
      label: "Priority",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <StatusPill
            label={row.priority}
            variant={
              row.priority === "High"
                ? "danger"
                : row.priority === "Medium"
                  ? "warning"
                  : "success"
            }
          />
        </div>
      ),
    },
    {
      key: "dueDate",
      label: "Due Date",
      accessor: "dueDate",
    },
    {
      key: "level",
      label: "Level",
      render: (row) => (
        <StatusPill
          label={row.level}
          variant={
            row.level === "High"
              ? "danger"
              : row.level === "Medium"
                ? "warning"
                : "success"
          }
        />
      ),
    },
    {
      key: "fileSize",
      label: "File Size",
      accessor: "fileSize",
      align: "right",
    },
  ];

  return (
    <div className="p-8 space-y-6">
      <DynamicTable
        title="User Table"
        data={files}
        columns={columns}
        selectable
        pagination
        pageSize={5}
        striped
        searchable
        searchPlaceholder="Search Users..."
        bulkActions={[
          {
            label: "Download",
            onClick: (selected) =>
              alert(`Downloading ${selected.length} files`),
            icon: <Download size={16} />,
          },
          {
            label: "Share",
            onClick: (selected) => alert(`Sharing ${selected.length} files`),
            icon: <Share2 size={16} />,
          },
          {
            label: "Delete",
            onClick: (selected) => alert(`Deleting ${selected.length} files`),
            icon: <Trash2 size={16} />,
            variant: "danger",
          },
        ]}
        actions={[
          {
            label: "View",
            onClick: (row) => alert(`Viewing ${row.name}`),
            icon: <Eye size={18} />,
          },
          {
            label: "Edit",
            onClick: (row) => alert(`Editing ${row.name}`),
            icon: <Pencil size={18} />,
          },
          {
            label: "Delete",
            onClick: (row) => alert(`Deleting ${row.name}`),
            icon: <Trash2 size={18} />,
            variant: "danger",
          },
        ]}
      />
    </div>
  );
};

export default AdvancedTableExample;
