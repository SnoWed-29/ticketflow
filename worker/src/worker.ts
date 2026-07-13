const shutdownSignals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];

console.log("TicketFlow worker started");
console.log("Queue processors have not been implemented yet.");

let shuttingDown = false;

function shutdown(signal: NodeJS.Signals): void {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  console.log(`TicketFlow worker received ${signal}; shutting down.`);
  process.exit(0);
}

for (const signal of shutdownSignals) {
  process.once(signal, () => shutdown(signal));
}

// Keep the placeholder process alive without pretending to process queues.
setInterval(() => undefined, 60_000);
