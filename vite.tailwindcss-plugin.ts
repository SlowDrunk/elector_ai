// 延迟加载 tailwindcss 插件以避免 ESM 加载问题
export async function getTailwindcssPlugin() {
  const tailwindcss = (await import('@tailwindcss/vite')).default;
  return tailwindcss();
}

