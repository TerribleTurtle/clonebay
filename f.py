with open('src/utils/WorkerManager.ts', 'r') as f:
    wm = f.read()

wm = wm.replace(
    '''        logger.error('WorkerManager: Worker crashed', error);
        this.scheduleRestart();
        throw error;''',
    '''        logger.error('WorkerManager: Worker crashed', error);
        this.scheduleRestart();'''
)

wm = wm.replace(
    '''      this.pongTimeout = setTimeout(() => {
        logger.error('WorkerManager: Missed PONG, terminating worker');
        this.scheduleRestart();
        throw new Error('WorkerManager: Missed PONG, terminating worker');
      }, this.PONG_TIMEOUT_MS);''',
    '''      this.pongTimeout = setTimeout(() => {
        logger.error('WorkerManager: Missed PONG, terminating worker');
        this.scheduleRestart();
      }, this.PONG_TIMEOUT_MS);'''
)

with open('src/utils/WorkerManager.ts', 'w') as f:
    f.write(wm)
