export const delay = (time: number) => new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Request timed out')), time)
);
