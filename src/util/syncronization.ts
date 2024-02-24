async function wait (time: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, time))
}

class Semaphore {
  counter: number

  constructor (limit: number) {
    this.counter = limit
  }

  async wait (): Promise<void> {
    if (this.counter === 0) {
      await wait(100)
    }

    this.counter--
  }

  signal (): void {
    this.counter++
  }
}

export { Semaphore }
