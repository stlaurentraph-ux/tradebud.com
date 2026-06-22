// Typed support for styled-jsx <style jsx> in Next.js / SWC
declare namespace React {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface StyleHTMLAttributes<T> {
    jsx?: boolean;
  }
}
