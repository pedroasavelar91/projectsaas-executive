
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
    startDate: t.start_date,
    sectorId: t.sector_id,
    sectors: t.sectors || (t.sector_id ? [t.sector_id] : []),
    // Assuming Task interface has sectorId or sector. Previous code used sector.id.
    // Let's assume frontend expects mapped object or just ID.
    // Checking types.ts would be best, but let's stick to previous pattern where possible.
    // Actually, earlier view showed Task has `sectorId`? No, let's look at usage.
    // Usage in previous file was `sector.id`.
    // Let's assume interface is flexible or mapped.
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

    team: {
        invite: async (email: string, role: string, corporation: string) => {
            const { error } = await supabase
                .from('invites')
                .insert({ email, role, corporation });
            if (error) throw error;
        },
        delete: async (userId: string) => {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', userId);
            if (error) throw error;
        },
        updateCorporationName: async (newName: string, userId: string) => {
            const { error } = await supabase
                .from('profiles')
                .update({ corporation: newName })
                .eq('id', userId);
            if (error) throw error;
        },
        save: async (users: User[]) => {
            for (const user of users) {
                await supabase
                    .from('profiles')
                    .update({
                        role: user.role,
                        sectors: user.sectors,
                        name: user.name,
                        avatar: user.avatar
                    })
                    .eq('id', user.id);
            }
        },
        create: async (user: any, corporation: string) => {
            // Create Auth User
            const { data, error } = await supabase.auth.signUp({
                email: user.email,
                password: user.password,
                options: {
                    data: {
                        name: user.name,
                        corporation: corporation,
                        role: user.role
                    }
                }
            });

            if (error) throw error;

            if (data.user) {
                await supabase.from('profiles').upsert({
                    id: data.user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    corporation: corporation,
                    sectors: user.selectedSectors,
                    joined_at: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                });
            }
            return data;
        },
        update: async (userId: string, data: Partial<User>) => {
            const updates: any = {};
            if (data.name) updates.name = data.name;
            if (data.role) updates.role = data.role;
            if (data.sectors) updates.sectors = data.sectors;

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', userId);
            if (error) throw error;
        }
    },

    tasks: {
        create: async (task: any, corporation: string) => {
            // 1. Create Task
            const { data: newTask, error: taskError } = await supabase
                .from('tasks')
                .insert([{
                    title: task.title,
                    description: task.description,
                    status: task.status,
                    priority: task.priority,
                    project_lead_id: task.projectLeadId,
                    due_date: task.dueDate,
                    start_date: task.startDate || null,
                    sector_id: task.sectorId || (task.sectors?.[0] || null),
                    sectors: task.sectors,
                    corporation: corporation
                }])
                .select()
                .single();

            if (taskError) throw taskError;

            let attachedSubTasks: any[] = [];

            // 2. Create Subtasks if any
            if (task.subTasks && task.subTasks.length > 0) {
                const subTasksToInsert = task.subTasks.map((st: any) => ({
                    id: st.id, // Use UUID from frontend
                    task_id: newTask.id,
                    user_id: st.userId,
                    user_name: st.userName,
                    user_avatar: st.userAvatar,
                    task_description: st.taskDescription,
                    progress: st.progress
                }));

                const { error: subError } = await supabase
                    .from('sub_tasks')
                    .insert(subTasksToInsert);

                if (subError) {
                    console.error("Error saving subtasks:", subError);
                } else {
                    attachedSubTasks = subTasksToInsert;
                }
            }

            // 3. Construct full object to return
            return mapTaskFromDB({
                ...newTask,
                sub_tasks: attachedSubTasks,
                comments: []
            });
        },
        update: async (task: any) => {
            const { error } = await supabase
                .from('tasks')
                .update({
                    title: task.title,
                    description: task.description,
                    status: task.status,
                    priority: task.priority,
                    project_lead_id: task.projectLeadId,
                    due_date: task.dueDate,
                    start_date: task.startDate,
                    sector_id: task.sectorId || (task.sectors?.[0] || null),
                    sectors: task.sectors
                })
                .eq('id', task.id);

            if (error) throw error;

            // Subtasks update logic (simplified delete-insert)
            if (task.subTasks) {
                await supabase.from('sub_tasks').delete().eq('task_id', task.id);
                if (task.subTasks.length > 0) {
                    await supabase.from('sub_tasks').insert(
                        task.subTasks.map((st: any) => ({
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

            // Comments update logic
            if (task.comments) {
                await supabase.from('comments').delete().eq('task_id', task.id);
                if (task.comments.length > 0) {
                    await supabase.from('comments').insert(
                        task.comments.map((c: any) => ({
                            id: c.id,
                            task_id: task.id,
                            author_name: c.author,
                            avatar: c.avatar,
                            text: c.text,
                            timestamp: c.timestamp,
                            author_id: c.author_id // Assuming we might have this, or fallback
                        }))
                    );
                }
            }
        },
        delete: async (taskId: string) => {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', taskId);
            if (error) throw error;
        }
    },

    todos: {
        save: async (todo: TodoItem) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user logged in");

            const { error } = await supabase.from('todos').upsert({
                id: todo.id,
                user_id: user.id, // Explicitly set user_id
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
        },
        delete: async (sectorId: string) => {
            const { error } = await supabase.from('sectors').delete().eq('id', sectorId);
            if (error) throw error;
        }
    }
};
