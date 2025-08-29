import { printMetaHelp } from './meta';
import { printArchiveHelp } from './archive';
import { printAlgoHelp } from './algo';
import type { Command } from 'commander';

export function printTopicHelp(topic: string, log: any, program: Command) {
  const t = (topic || '').toLowerCase();
  const commands = new Set(program.commands.map(c => c.name()));
  const topics = ['meta', 'archive', 'algo'];

  // Handle topic help
  if (t === 'meta') return printMetaHelp(log);
  if (t === 'archive') return printArchiveHelp(log);
  if (t === 'algo') return printAlgoHelp(log);

  // Handle command help
  if (commands.has(t)) {
    const cmd = program.commands.find(c => c.name() === t)!;
    cmd.outputHelp();
    return;
  }

  // Unknown topic/command
  log.error(`Unknown help topic: ${topic}`);
  log.info(`Available topics: ${topics.join(', ')}`);
  log.info(`Commands: ${[...commands].join(', ')}`);
  log.info(`Use: droply help <topic|command>`);
}
