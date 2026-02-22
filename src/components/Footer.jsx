export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-[1400px] px-4 py-3 text-xs text-gray-500">
        © {new Date().getFullYear()} OlympicHotel Dashboard — All rights reserved.
      </div>
    </footer>
  );
}