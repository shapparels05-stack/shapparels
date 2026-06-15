"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, X, FolderUp } from "lucide-react";
import { toast } from "sonner";

const MAX_WIDTH = 1600;
const MAX_HEIGHT = 1600;
const QUALITY = 0.85;
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB (under Vercel's 4.5MB limit)
const CONCURRENCY = 4; // simultaneous uploads

function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    // Skip if already small enough
    if (file.size <= MAX_FILE_SIZE) {
      resolve(file);
      return;
    }

    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Scale down if needed
      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Compression failed"));
          resolve(new File([blob], file.name, { type: "image/webp" }));
        },
        "image/webp",
        QUALITY
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

// Recursively collect File objects from a dropped file/folder entry.
function readEntryFiles(entry: FileSystemEntry | null): Promise<File[]> {
  return new Promise((resolve) => {
    if (!entry) return resolve([]);
    if (entry.isFile) {
      (entry as FileSystemFileEntry).file(
        (f) => resolve([f]),
        () => resolve([])
      );
    } else if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      const all: File[] = [];
      const readBatch = () => {
        reader.readEntries(
          async (entries) => {
            if (!entries.length) return resolve(all);
            for (const e of entries) all.push(...(await readEntryFiles(e)));
            readBatch(); // readEntries yields in batches; keep going
          },
          () => resolve(all)
        );
      };
      readBatch();
    } else {
      resolve([]);
    }
  });
}

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export function ImageUpload({ images, onChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // webkitdirectory isn't a typed React prop — set it on the element directly.
  useEffect(() => {
    if (folderInputRef.current) {
      folderInputRef.current.setAttribute("webkitdirectory", "");
      folderInputRef.current.setAttribute("directory", "");
    }
  }, []);

  const uploadFiles = useCallback(
    async (incoming: File[]) => {
      const files = incoming
        .filter((f) => f.type.startsWith("image/"))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

      if (files.length === 0) {
        toast.error("No image files found");
        return;
      }

      setUploading(true);
      setProgress({ done: 0, total: files.length });

      // Order-preserving results so a folder uploads in filename order.
      const results: (string | null)[] = new Array(files.length).fill(null);
      let failures = 0;
      let next = 0;

      const worker = async () => {
        while (next < files.length) {
          const i = next++;
          try {
            const compressed = await compressImage(files[i]);
            const fd = new FormData();
            fd.append("file", compressed);
            const res = await fetch("/api/upload", { method: "POST", body: fd });
            if (res.ok) {
              const { url } = await res.json();
              results[i] = url;
            } else {
              failures++;
            }
          } catch {
            failures++;
          } finally {
            setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
          }
        }
      };

      await Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, files.length) }, worker)
      );

      const uploaded = results.filter((u): u is string => Boolean(u));
      if (uploaded.length) onChange([...images, ...uploaded]); // single update (no stale-loop bug)
      if (uploaded.length) toast.success(`${uploaded.length} image(s) uploaded`);
      if (failures) toast.error(`${failures} image(s) failed`);

      setUploading(false);
      setProgress(null);
    },
    [images, onChange]
  );

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const dt = e.dataTransfer;
      const items = dt.items;
      // Use the entry API so dropped folders are read recursively.
      if (items && items.length && typeof items[0].webkitGetAsEntry === "function") {
        const entries = Array.from(items)
          .map((it) => it.webkitGetAsEntry())
          .filter((entry): entry is FileSystemEntry => entry !== null);
        const arrays = await Promise.all(entries.map(readEntryFiles));
        await uploadFiles(arrays.flat());
      } else {
        await uploadFiles(Array.from(dt.files));
      }
    },
    [uploadFiles]
  );

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Existing images */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((url, index) => (
            <div
              key={index}
              className="group relative h-24 w-24 overflow-hidden rounded-md border border-border/50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Product image ${index + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          dragging ? "border-primary bg-primary/5" : "border-border/60"
        }`}
      >
        <Upload className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {uploading && progress
            ? `Uploading ${progress.done} / ${progress.total}...`
            : "Drag & drop images or a folder here, or"}
        </p>

        {!uploading && (
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-accent"
            >
              Choose files
            </button>
            <button
              type="button"
              onClick={() => folderInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-accent"
            >
              <FolderUp className="h-4 w-4" />
              Choose folder
            </button>
          </div>
        )}

        {/* Progress bar */}
        {uploading && progress && (
          <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
            />
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) uploadFiles(Array.from(e.target.files));
            e.target.value = "";
          }}
        />
        <input
          ref={folderInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) uploadFiles(Array.from(e.target.files));
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
