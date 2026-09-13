import { SegmentContent } from '../../../../components/SegmentContent/SegmentContent';
import { getContent } from '../../../../lib/content';
import { getTaskAudio, getTaskPhoto } from '../../../../lib/db';
import type { Task } from '../../../../types/task';

interface TaskContentProps {
  task: Task;
}

// Thin task-specific wrapper around the shared SegmentContent — only
// supplies which store ("tasks" media) to read photos/audio from.
export function TaskContent({ task }: TaskContentProps) {
  return <SegmentContent content={getContent(task)} getPhoto={getTaskPhoto} getAudio={getTaskAudio} />;
}
