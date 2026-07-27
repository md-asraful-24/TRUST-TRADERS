import { supabase } from './supabase';

/**
 * Fetch JSON data from the Supabase json_store table.
 * If it doesn't exist, it returns the provided defaultValue (or []).
 */
export async function getJson(id: string, defaultValue: any = []) {
  try {
    const { data, error } = await supabase
      .from('json_store')
      .select('data')
      .eq('id', id)
      .single();

    if (error || !data) {
      return defaultValue;
    }
    return data.data;
  } catch (err) {
    console.error(`Error fetching json_store for ${id}:`, err);
    return defaultValue;
  }
}

/**
 * Upsert JSON data into the Supabase json_store table.
 */
export async function saveJson(id: string, dataToSave: any) {
  try {
    const { error } = await supabase
      .from('json_store')
      .upsert({ 
        id, 
        data: dataToSave, 
        updated_at: new Date().toISOString() 
      }, { onConflict: 'id' });

    if (error) {
      console.error(`Error saving json_store for ${id}:`, error);
      throw new Error(error.message);
    }
  } catch (err: any) {
    console.error(`Exception saving json_store for ${id}:`, err);
    throw new Error(err.message || 'Failed to save data to database');
  }
}
