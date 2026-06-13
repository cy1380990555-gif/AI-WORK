/**
 * 流式响应处理工具
 */

// 将 AsyncGenerator 的流式文本转换为 ReadableStream
export function streamToReadableStream(stream: AsyncGenerator<string>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async pull(controller) {
      try {
        const { value, done } = await stream.next();
        if (done) {
          controller.close();
          return;
        }
        controller.enqueue(encoder.encode(value));
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

// 从流式响应中累积完整文本
export async function accumulateStream(stream: AsyncGenerator<string>): Promise<string> {
  let result = '';
  for await (const chunk of stream) {
    result += chunk;
  }
  return result;
}
