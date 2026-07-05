/** Notes use GFM task list syntax. We treat unchecked items as "open tasks". */
export function countOpenTasks(content: string): number {
  const matches = content.match(/^\s*-\s\[ \]\s/gm)
  return matches ? matches.length : 0
}

export function countOpenTasksInNotes(notes: { content: string }[]): number {
  return notes.reduce((sum, n) => sum + countOpenTasks(n.content), 0)
}
