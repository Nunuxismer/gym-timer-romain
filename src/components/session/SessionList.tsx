import { Button } from '@/components/ui/button';
import { Plus, FileJson } from 'lucide-react';
import { motion } from 'framer-motion';
import type { StoredSession } from '@/types/jsonSession';
import { SessionCard } from './SessionCard';

interface SessionListProps {
  sessions: StoredSession[];
  onImport: () => void;
  onStart: (sessionId: string) => void;
  onView: (sessionId: string) => void;
  onEdit: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  onSaveToCloud?: (sessionId: string) => void;
  isLoggedIn?: boolean;
}

export function SessionList({ sessions, onImport, onStart, onView, onEdit, onDelete, onSaveToCloud, isLoggedIn }: SessionListProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
          <FileJson className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Aucune séance programmée
        </h2>
        <p className="text-muted-foreground mb-6">
          Importez un fichier JSON pour créer votre première séance
        </p>
        <Button variant="default" size="lg" onClick={onImport}>
          <Plus className="w-5 h-5 mr-2" />
          Importer une séance
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Mes séances ({sessions.length})
        </h2>
        <Button variant="outline" size="sm" onClick={onImport}>
          <Plus className="w-4 h-4 mr-1" />
          Importer
        </Button>
      </div>

      <div className="space-y-3">
        {sessions.map((session) => (
          <SessionCard
            key={session.session.session_id}
            session={session}
            onStart={() => onStart(session.session.session_id)}
            onView={() => onView(session.session.session_id)}
            onEdit={() => onEdit(session.session.session_id)}
            onDelete={() => onDelete(session.session.session_id)}
            onSaveToCloud={onSaveToCloud ? () => onSaveToCloud(session.session.session_id) : undefined}
            isLoggedIn={isLoggedIn}
          />
        ))}
      </div>
    </motion.div>
  );
}
