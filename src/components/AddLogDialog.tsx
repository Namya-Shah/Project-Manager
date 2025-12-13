import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

interface AddLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (content: string, date?: string) => void;
  projectName: string;
}

const AddLogDialog = ({ open, onOpenChange, onAdd, projectName }: AddLogDialogProps) => {
  const [content, setContent] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    onAdd(content.trim(), date);
    setContent('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl">Log Progress</DialogTitle>
          <p className="text-sm text-muted-foreground">
            What did you work on in <span className="text-primary font-medium">{projectName}</span>?
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-secondary/50 border-border/50 font-mono"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content">What did you accomplish?</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Added authentication feature, fixed styling bug, refactored database queries..."
              className="bg-secondary/50 border-border/50 resize-none"
              rows={4}
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!content.trim()}>
              Add Log
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddLogDialog;
