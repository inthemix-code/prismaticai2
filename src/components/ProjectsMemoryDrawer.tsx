import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  FolderKanban,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  Brain,
  Pin,
} from 'lucide-react';
import { useAIStore } from '../stores/aiStore';
import { toast } from 'sonner';

interface ProjectsMemoryDrawerProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ProjectsMemoryDrawer({ trigger, open: openProp, onOpenChange }: ProjectsMemoryDrawerProps = {}) {
  const [openInternal, setOpenInternal] = useState(false);
  const open = openProp ?? openInternal;
  const setOpen = (v: boolean) => {
    setOpenInternal(v);
    onOpenChange?.(v);
  };
  const projects = useAIStore((s) => s.projects);
  const activeProjectId = useAIStore((s) => s.activeProjectId);
  const loadProjects = useAIStore((s) => s.loadProjects);
  const createProject = useAIStore((s) => s.createProject);
  const updateProject = useAIStore((s) => s.updateProject);
  const deleteProject = useAIStore((s) => s.deleteProject);
  const setActiveProject = useAIStore((s) => s.setActiveProject);
  const projectMemory = useAIStore((s) => s.projectMemory);
  const loadMemoryForActiveProject = useAIStore((s) => s.loadMemoryForActiveProject);
  const removeMemory = useAIStore((s) => s.removeMemory);
  const updateMemoryFact = useAIStore((s) => s.updateMemoryFact);

  const [newName, setNewName] = useState('');
  const [newPersona, setNewPersona] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPersona, setEditPersona] = useState('');

  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [editMemoryFact, setEditMemoryFact] = useState('');

  useEffect(() => {
    if (open) void loadProjects();
  }, [open, loadProjects]);

  useEffect(() => {
    if (activeProjectId) void loadMemoryForActiveProject();
  }, [activeProjectId, loadMemoryForActiveProject]);

  const activeMemory = activeProjectId ? projectMemory[activeProjectId] ?? [] : [];
  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    const p = await createProject({ name, systemPersona: newPersona.trim() });
    if (p) {
      setActiveProject(p.id);
      setNewName('');
      setNewPersona('');
      setShowCreate(false);
      toast.success(`Project "${p.name}" created`);
    }
  };

  const startEditProject = (id: string) => {
    const p = projects.find((x) => x.id === id);
    if (!p) return;
    setEditingProjectId(id);
    setEditName(p.name);
    setEditPersona(p.systemPersona);
  };

  const saveEditProject = async () => {
    if (!editingProjectId) return;
    await updateProject(editingProjectId, { name: editName.trim(), systemPersona: editPersona });
    setEditingProjectId(null);
    toast.success('Project updated');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project? Conversations linked to it will be unlinked but retained.')) return;
    await deleteProject(id);
    toast.success('Project deleted');
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white hover:bg-gray-800 text-xs sm:text-sm px-2 sm:px-3 h-8 gap-1.5"
            aria-label="Open projects and memory"
          >
            <FolderKanban className="w-4 h-4" />
            <span className="hidden sm:inline">
              {activeProject ? activeProject.name : 'Projects'}
            </span>
            {activeProject && (
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: activeProject.color }}
              />
            )}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md bg-gray-950 border-gray-800 p-0 overflow-hidden flex flex-col">
        <SheetHeader className="px-4 py-3 border-b border-gray-800">
          <SheetTitle className="text-white flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-cyan-400" />
            Projects &amp; Memory
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Projects list */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Projects</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowCreate((v) => !v)}
                className="h-7 text-xs text-cyan-300 hover:text-cyan-200 hover:bg-cyan-500/10"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                New
              </Button>
            </div>

            {showCreate && (
              <div className="mb-3 p-3 rounded-lg border border-gray-800 bg-gray-900 space-y-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Project name"
                  className="bg-gray-950 border-gray-800 text-sm h-8"
                />
                <Textarea
                  value={newPersona}
                  onChange={(e) => setNewPersona(e.target.value)}
                  placeholder="Optional system persona (e.g. 'Respond like a senior product strategist.')"
                  rows={2}
                  className="bg-gray-950 border-gray-800 text-xs min-h-[60px]"
                />
                <div className="flex justify-end gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setShowCreate(false)} className="h-7 text-xs">
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleCreate} className="h-7 text-xs bg-cyan-500 hover:bg-cyan-400 text-black">
                    Create
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <button
                onClick={() => setActiveProject(null)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
                  !activeProjectId ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-600" />
                  Unfiled
                </span>
              </button>
              {projects.map((p) => (
                <div
                  key={p.id}
                  className={`group rounded-md text-sm transition-colors ${
                    activeProjectId === p.id ? 'bg-gray-800' : 'hover:bg-gray-900'
                  }`}
                >
                  {editingProjectId === p.id ? (
                    <div className="p-2 space-y-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="bg-gray-950 border-gray-800 text-sm h-8"
                      />
                      <Textarea
                        value={editPersona}
                        onChange={(e) => setEditPersona(e.target.value)}
                        rows={2}
                        className="bg-gray-950 border-gray-800 text-xs min-h-[50px]"
                        placeholder="System persona"
                      />
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setEditingProjectId(null)} className="h-7 w-7 p-0">
                          <X className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" onClick={saveEditProject} className="h-7 w-7 p-0 bg-cyan-500 hover:bg-cyan-400 text-black">
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <button
                        onClick={() => setActiveProject(p.id)}
                        className="flex-1 min-w-0 text-left px-3 py-2 flex items-center gap-2"
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className={`truncate ${activeProjectId === p.id ? 'text-white' : 'text-gray-300'}`}>
                          {p.name}
                        </span>
                      </button>
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity pr-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditProject(p.id)}
                          className="h-7 w-7 p-0"
                          aria-label="Edit project"
                        >
                          <Pencil className="w-3 h-3 text-gray-400" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(p.id)}
                          className="h-7 w-7 p-0"
                          aria-label="Delete project"
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Memory panel */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Pinned memory
              </h3>
              {activeProject && (
                <span className="text-xs text-gray-500">· {activeProject.name}</span>
              )}
            </div>

            {!activeProjectId && (
              <p className="text-xs text-gray-500 italic">
                Select a project to view its pinned memory. Memory is applied to prompts sent within that project.
              </p>
            )}

            {activeProjectId && activeMemory.length === 0 && (
              <div className="text-center py-6 text-xs text-gray-500">
                <Pin className="w-5 h-5 mx-auto mb-2 opacity-50" />
                No pinned facts yet. Use the pin icon next to any synthesis sentence to save it here.
              </div>
            )}

            <div className="space-y-2">
              {activeMemory.map((m) => (
                <div
                  key={m.id}
                  className="group p-3 rounded-lg border border-gray-800 bg-gray-900/50 hover:border-gray-700 transition-colors"
                >
                  {editingMemoryId === m.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editMemoryFact}
                        onChange={(e) => setEditMemoryFact(e.target.value)}
                        rows={3}
                        className="bg-gray-950 border-gray-800 text-xs"
                      />
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setEditingMemoryId(null)} className="h-7 w-7 p-0">
                          <X className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={async () => {
                            await updateMemoryFact(m.id, editMemoryFact.trim());
                            setEditingMemoryId(null);
                            toast.success('Memory updated');
                          }}
                          className="h-7 w-7 p-0 bg-cyan-500 hover:bg-cyan-400 text-black"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-gray-200 leading-relaxed break-words">{m.fact}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-gray-500">
                          {new Date(m.createdAt).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingMemoryId(m.id);
                              setEditMemoryFact(m.fact);
                            }}
                            className="h-6 w-6 p-0"
                            aria-label="Edit memory"
                          >
                            <Pencil className="w-3 h-3 text-gray-400" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              await removeMemory(m.id);
                              toast.success('Memory removed');
                            }}
                            className="h-6 w-6 p-0"
                            aria-label="Remove memory"
                          >
                            <Trash2 className="w-3 h-3 text-red-400" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
