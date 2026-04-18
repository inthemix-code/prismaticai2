import { useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAIStore } from '../stores/aiStore';

function ProjectBadgeComponent() {
  const projects = useAIStore((s) => s.projects);
  const activeProjectId = useAIStore((s) => s.activeProjectId);
  const setActiveProject = useAIStore((s) => s.setActiveProject);
  const createProject = useAIStore((s) => s.createProject);
  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPersona, setNewPersona] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreatePersona = async () => {
    const name = newName.trim();
    if (!name) return;

    setIsCreating(true);
    try {
      const p = await createProject({ name, systemPersona: newPersona.trim() });
      if (p) {
        setActiveProject(p.id);
        setNewName('');
        setNewPersona('');
        setShowCreate(false);
        setOpen(false);
        toast.success(`Persona "${p.name}" created`);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isCreating) {
      e.preventDefault();
      handleCreatePersona();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowCreate(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={activeProject ? `Active persona: ${activeProject.name}` : 'Select a persona'}
          className="inline-flex items-center gap-1.5 h-6 px-1.5 rounded-md hover:bg-white/5 transition-colors text-[11px] text-gray-500 hover:text-gray-300"
        >
          {activeProject && (
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: activeProject.color }}
            />
          )}
          <span className="max-w-[120px] truncate">
            {activeProject ? activeProject.name : 'No persona'}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" side="top" className="w-64 p-1 bg-gray-950 border-white/10">
        <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-gray-500">
          Persona context
        </div>
        <button
          type="button"
          onClick={() => {
            setActiveProject(null);
            setOpen(false);
          }}
          className={`w-full flex items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors ${
            !activeProjectId ? 'bg-cyan-500/15 text-cyan-200' : 'text-gray-300 hover:bg-white/5'
          }`}
        >
          <span>No persona</span>
          {!activeProjectId && <Check className="w-3 h-3" />}
        </button>
        <div className="max-h-64 overflow-y-auto">
          {projects.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setActiveProject(p.id);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors ${
                activeProjectId === p.id ? 'bg-cyan-500/15 text-cyan-200' : 'text-gray-300 hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                <span className="truncate">{p.name}</span>
              </span>
              {activeProjectId === p.id && <Check className="w-3 h-3 flex-shrink-0" />}
            </button>
          ))}
        </div>

        {showCreate ? (
          <div className="px-2 py-2 border-t border-white/10 space-y-2">
            <Input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Persona name"
              autoFocus
              disabled={isCreating}
              className="bg-gray-950 border-white/10 text-xs h-8"
            />
            <Textarea
              value={newPersona}
              onChange={(e) => setNewPersona(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Optional system instructions"
              disabled={isCreating}
              rows={2}
              className="bg-gray-950 border-white/10 text-xs min-h-[60px]"
            />
            <div className="flex justify-end gap-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowCreate(false)}
                disabled={isCreating}
                className="h-7 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleCreatePersona}
                disabled={!newName.trim() || isCreating}
                className="h-7 text-xs bg-cyan-500 hover:bg-cyan-400 text-black font-medium"
              >
                {isCreating ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            type="button"
            className="w-full flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-cyan-300 hover:bg-cyan-500/10 transition-colors border-t border-white/10 mt-1"
          >
            <Plus className="w-3 h-3" />
            New persona
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}

export const ProjectBadge = memo(ProjectBadgeComponent);
