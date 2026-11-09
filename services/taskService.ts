import {
  addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc,
} from 'firebase/firestore';
import { assertFirebaseConfig, db } from '@/lib/firebase';
import { assertSupabaseConfig, imageBucket, supabase } from '@/lib/supabase';

export type Task = {
  id: string;
  title: string;
  details: string;
  imageUrl: string | null;
  imagePath: string | null;
  completed: boolean;
  createdAt: unknown;
  updatedAt: unknown;
};

export type TaskInput = Pick<Task, 'title' | 'details'>;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const tasks = collection(db, 'tasks');

export function validateImage(file: File) {
  if (!imageTypes.includes(file.type)) throw new Error('Choose a JPEG, PNG, WebP, or GIF image.');
  if (file.size > MAX_IMAGE_BYTES) throw new Error('Images must be 5 MB or smaller.');
}

async function uploadImage(file: File) {
  assertSupabaseConfig();
  validateImage(file);
  const ext = file.type.split('/')[1].replace('jpeg', 'jpg');
  const path = `backgrounds/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(imageBucket).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(`Image upload failed: ${error.message}`);
  const { data } = supabase.storage.from(imageBucket).getPublicUrl(path);
  return { imagePath: path, imageUrl: data.publicUrl };
}

async function removeImage(path: string | null) {
  if (!path) return;
  assertSupabaseConfig();
  const { error } = await supabase.storage.from(imageBucket).remove([path]);
  if (error) throw new Error(`Image removal failed: ${error.message}`);
}

export async function listTasks(): Promise<Task[]> {
  assertFirebaseConfig();
  const result = await getDocs(query(tasks, orderBy('createdAt', 'desc')));
  return result.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() } as Task));
}

export async function createTask(input: TaskInput, file?: File | null) {
  assertFirebaseConfig();
  const image = file ? await uploadImage(file) : { imagePath: null, imageUrl: null };
  try {
    const created = await addDoc(tasks, {
      title: input.title.trim(), details: input.details.trim(), ...image,
      completed: false, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
    return created.id;
  } catch (error) {
    if (image.imagePath) {
      try { await removeImage(image.imagePath); } catch (cleanupError) { console.error('Failed to clean up uploaded image', cleanupError); }
    }
    throw error;
  }
}

export async function updateTask(task: Task, input: TaskInput, file?: File | null, removeCurrentImage = false) {
  assertFirebaseConfig();
  const replacement = file ? await uploadImage(file) : null;
  const image = replacement ?? (removeCurrentImage ? { imageUrl: null, imagePath: null } : null);
  try {
    await updateDoc(doc(db, 'tasks', task.id), {
      title: input.title.trim(), details: input.details.trim(), updatedAt: serverTimestamp(),
      ...(image ?? {}),
    });
  } catch (error) {
    if (replacement) {
      try { await removeImage(replacement.imagePath); } catch (cleanupError) { console.error('Failed to clean up replacement image', cleanupError); }
    }
    throw error;
  }
  if (image && task.imagePath) {
    try { await removeImage(task.imagePath); }
    catch (error) { throw new Error(`Task updated with the new image, but the previous image could not be removed: ${error instanceof Error ? error.message : 'unknown storage error'}`); }
  }
}

export async function setTaskCompleted(task: Task, completed: boolean) {
  assertFirebaseConfig();
  await updateDoc(doc(db, 'tasks', task.id), { completed, updatedAt: serverTimestamp() });
}

export async function deleteTask(task: Task) {
  assertFirebaseConfig();
  // Storage-first policy: never remove the task record when its image cannot be deleted.
  await removeImage(task.imagePath);
  await deleteDoc(doc(db, 'tasks', task.id));
}
