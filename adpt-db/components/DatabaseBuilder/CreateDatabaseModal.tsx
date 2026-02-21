'use client';

import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { X, Database as DatabaseIcon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useState } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  onUpdate: (name: string) => void;
  editingName?: string;
};

export default function CreateDatabaseModal({ open, onClose, onSave, editingName, onUpdate }: Props) {
  const { currentTheme } = useTheme();
  const [name, setName] = useState(editingName || '');
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSave = () => {
    if (!name.trim()) {
      setError('Database name is required');
      return;
    }

    if (name.length < 3) {
      setError('Database name must be at least 3 characters');
      return;
    }

    onSave(name.trim());
    setName('');
    setError('');
  };

  const handleUpdate = () => {
    onUpdate(name.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
      <Card
        className="w-full max-w-md"
        style={{
          backgroundColor: currentTheme.surface,
          border: `1px solid ${currentTheme.border}`,
        }}
      >
        {/* Header */}
        <div
          className="p-6 flex items-center justify-between"
          style={{
            borderBottom: `1px solid ${currentTheme.border}`,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: currentTheme.primary }}
            >
              <DatabaseIcon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold" style={{ color: currentTheme.text }}>
              {editingName ? 'Update Database' : 'Create Database'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:scale-110 transition-all"
            style={{
              backgroundColor: currentTheme.background,
              border: `1px solid ${currentTheme.border}`,
              color: currentTheme.text,
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <Label style={{ color: currentTheme.text }}>Database Name</Label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="e.g., Customer Database, Inventory System"
              className="mt-2"
              style={{
                backgroundColor: currentTheme.background,
                border: `1px solid ${currentTheme.border}`,
                color: currentTheme.text,
              }}
              autoFocus={!editingName}
              onKeyPress={(e) => e.key === 'Enter' && handleSave()}
              readOnly={!!editingName}
            />
            {error && (
              <p className="text-sm mt-2" style={{ color: '#ef4444' }}>
                {error}
              </p>
            )}
          </div>

          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: currentTheme.background,
              border: `1px solid ${currentTheme.border}`,
            }}
          >
            <p className="text-sm" style={{ color: currentTheme.textSecondary }}>
              This will save your form schema and create a new database folder in your dashboard.
              You can add records and manage data through this database.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div
          className="p-6 flex justify-end gap-3"
          style={{
            borderTop: `1px solid ${currentTheme.border}`,
          }}
        >
          <Button
            variant="ghost"
            onClick={onClose}
            style={{
              backgroundColor: currentTheme.background,
              border: `1px solid ${currentTheme.border}`,
              color: currentTheme.text,
            }}
          >
            Cancel
          </Button>
          {
            !editingName ? (
              <Button
                onClick={handleSave}
                disabled={!name.trim()}
                style={{
                  backgroundColor: currentTheme.primary,
                  color: '#ffffff',
                  opacity: !name.trim() ? 0.5 : 1,
                }}
              >
                Create Database
              </Button>
            ) : (
              <Button
                onClick={handleUpdate}
                disabled={!name.trim()}
                style={{
                  backgroundColor: currentTheme.primary,
                  color: '#ffffff',
                  opacity: !name.trim() ? 0.5 : 1,
                }}
              >
              Update Database
              </Button>
            )
          }
        </div>
      </Card>
    </div>
  );
}
