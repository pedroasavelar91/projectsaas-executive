
import { supabase } from './supabase';
import { Task, Sector, User, TodoItem, SubTask, Comment } from '../types';

// Data Mappers
const mapUserFromDB = (u: any): User => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    avatar: u.avatar,
    joinedAt: u.joined_at,
    corporation: u.corporation,
    sectors: u.sectors || [],
    status: u.status
});

const mapTaskFromDB = (t: any): Task => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    projectLeadId: t.project_lead_id,
    dueDate: t.due_date,
    sectorId: t.sector_id,
    subTasks: t.sub_tasks?.map((st: any) => ({
        id: st.id,
        userId: st.user_id,
        userName: st.user_name,
        userAvatar: st.user_avatar,
        taskDescription: st.task_description,
        progress: st.progress
    })) || [],
    comments: t.comments?.map((c: any) => ({
        id: c.id,
        author: c.author_name,
        avatar: c.avatar,
        text: c.text,
        timestamp: c.timestamp
    })) || []
});

const mapTodoFromDB = (t: any): TodoItem => ({
    id: t.id,
    text: t.text,
    completed: t.completed,
    dueDate: t.due_date
});

export const api = {
    fetchInitialData: async () => {
        try {
            const [sectorsRes, profilesRes, tasksRes, todosRes] = await Promise.all([
                supabase.from('sectors').select('*'),
                supabase.from('profiles').select('*'),
                supabase.from('tasks').select('*, sub_tasks(*), comments(*)'),
                supabase.from('todos').select('*')
            ]);

            if (sectorsRes.error) throw sectorsRes.error;
            if (profilesRes.error) throw profilesRes.error;
            if (tasksRes.error) throw tasksRes.error;
            if (todosRes.error) throw todosRes.error;

            return {
                sectors: sectorsRes.data as Sector[],
                team: profilesRes.data.map(mapUserFromDB),
                tasks: tasksRes.data.map(mapTaskFromDB),
                todos: todosRes.data.map(mapTodoFromDB)
            };
        } catch (error) {
            console.error('Error fetching initial data:', error);
            return null;
        }
    },

    tasks: {
        create: async (task: Task) => {
            // In production, we rely on RLS and Auth.
            // Ensure task.id is a UUID or let DB generate it. 
            // Ideally, we should pass "id" only if we generated a valid UUID locally.

            const { error } = await supabase.from('tasks').insert({
                id: task.id,
                title: task.title,
                description: task.description,
                status: task.status,
                priority: task.priority,
                project_lead_id: task.projectLeadId,
                due_date: task.dueDate,
                sector_id: task.sectorId
            });
            if (error) throw error;

            if (task.subTasks.length > 0) {
                await supabase.from('sub_tasks').insert(
                    task.subTasks.map(st => ({
                        id: st.id,
                        task_id: task.id,
                        user_id: st.userId,
                        user_name: st.userName,
                        user_avatar: st.userAvatar,
                        task_description: st.taskDescription,
                        progress: st.progress
                    }))
                );
            }
        },
        update: async (task: Task) => {
            const { error } = await supabase.from('tasks').update({
                title: task.title,
                description: task.description,
                status: task.status,
                priority: task.priority,
                project_lead_id: task.projectLeadId,
                due_date: task.dueDate,
                sector_id: task.sectorId
            }).eq('id', task.id);

            if (error) throw error;

            await supabase.from('sub_tasks').delete().eq('task_id', task.id);
            if (task.subTasks.length > 0) {
                await supabase.from('sub_tasks').insert(
                    task.subTasks.map(st => ({
                        id: st.id,
                        task_id: task.id,
                        user_id: st.userId,
                        user_name: st.userName,
                        user_avatar: st.userAvatar,
                        task_description: st.taskDescription,
                        progress: st.progress
                    }))
                );
            }
        }
    },

    todos: {
        save: async (todo: TodoItem) => {
            // id, user_id (handled by default auth.uid() if insert, but we need to match RLS)
            const { error } = await supabase.from('todos').upsert({
                id: todo.id,
                text: todo.text,
                completed: todo.completed,
                due_date: todo.dueDate
            });
            if (error) throw error;
        },
        delete: async (id: string) => {
            const { error } = await supabase.from('todos').delete().eq('id', id);
            if (error) throw error;
        }
    },

    sectors: {
        save: async (sectors: Sector[]) => {
            if (sectors.length === 0) return;
            const { error } = await supabase.from('sectors').upsert(sectors);
            if (error) throw error;
        }
    },

    team: {
        save: async (users: User[]) => {
            // Profile updates are restricted by RLS (only own profile).
            // If Admin tries to update others, it might fail unless we adjust RLS.
            // For now, we assume user updates themselves via handleUpdateProfile.
            if (users.length === 0) return;

            // We only update corresponding profiles, not insert new ones (Trigger handles insert)
            const profiles = users.map(u => ({
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role,
                avatar: u.avatar,
                joined_at: u.joinedAt,
                corporation: u.corporation,
                sectors: u.sectors
            }));

            const { error } = await supabase.from('profiles').upsert(profiles);
            if (error) throw error;
        }
    }
};
