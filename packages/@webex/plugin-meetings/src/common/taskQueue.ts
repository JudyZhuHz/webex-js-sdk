import {Defer} from '@webex/common';
import window from 'global/window';

type Task<TResult> = () => TResult;
type TaskItem<TResult> = {task: Task<TResult>; defer: Defer};
type CancelScheduler = () => void;
type TaskQueueScheduler = (fn: () => void) => CancelScheduler;
type TaskQueueOptions = {
  scheduler?: TaskQueueScheduler;
};

const timeout = (task) => setTimeout(task, 1000 / 60);
const defaultSchedulerFactory = (): TaskQueueScheduler => {
  const scheduler = window.requestIdleCallback || window.requestAnimationFrame || timeout;
  const cancel = window.cancelIdleCallback || window.cancelAnimationFrame || clearTimeout;

  return (task) => {
    const handle: any = scheduler(task);

    return () => cancel(handle);
  };
};

/**
 * Execute tasks asynchronously in fifo order.
 *
 * Task scheduler can be customised.
 * The default scheduler is the `requestIdleCallback` API which falls back to `requestAnimationFrame` or `setTimeout`
 *
 * Ideal for breaking up long running tasks.
 * @link https://web.dev/long-tasks-devtools/
 * @returns {TaskQueue}
 */
export default class TaskQueue<TResult = void> {
  private readonly scheduler;
  private readonly queue: TaskItem<TResult>[] = [];
  private cancelSchedule?: CancelScheduler;
  private running = false;
  private currentTask?: TaskItem<TResult>;

  /**
   * @constructs TaskQueue
   */
  constructor({scheduler}: TaskQueueOptions = {}) {
    this.scheduler = scheduler || defaultSchedulerFactory();
  }

  private run = () => {
    if (!this.running && this.queue.length > 0) {
      this.running = true;
      this.currentTask = this.queue.shift();
      this.cancelSchedule = this.scheduler(() => {
        try {
          const result = this.currentTask.task();
          this.currentTask.defer.resolve(result);
          this.running = false;
          this.run();
        } catch (error) {
          this.stopRunning(error);
        }
      });
    }
  };

  /**
   * Stop runner, reject last task and clean up resources
   *
   * @param {string|Error} error
   * @private
   * @returns {void}
   */
  private stopRunning = (error) => {
    if (this.running) {
      this.cancelSchedule();
      this.running = false;
      this.currentTask.defer.reject(error);
    }
    this.queue.length = 0;
  };

  /**
   * Add a new task to the queue and start execution
   * @param {Task} task
   * @returns {Promise<TResult>}
   */
  public addTask(task: Task<TResult>): Promise<TResult> {
    const defer = new Defer();
    this.queue.push({task, defer});
    this.run();

    return defer.promise;
  }

  /**
   * Stop the current task if any and clean the queue
   * @returns {void}
   */
  public clear() {
    this.stopRunning('Task was cancelled');
  }
}
