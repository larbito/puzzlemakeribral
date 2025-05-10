const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Get all puzzles for a user
router.get('/', async (req, res) => {
  try {
    const { authorization } = req.headers;
    if (!authorization) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authorization.replace('Bearer ', '')
    );

    if (userError) throw userError;

    const { data: puzzles, error } = await supabase
      .from('puzzles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ puzzles });
  } catch (error) {
    console.error('Get puzzles error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new puzzle
router.post('/', async (req, res) => {
  try {
    const { authorization } = req.headers;
    if (!authorization) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authorization.replace('Bearer ', '')
    );

    if (userError) throw userError;

    const { title, description, content } = req.body;
    const { data, error } = await supabase
      .from('puzzles')
      .insert([
        {
          title,
          description,
          content,
          user_id: user.id
        }
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Create puzzle error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a puzzle
router.put('/:id', async (req, res) => {
  try {
    const { authorization } = req.headers;
    if (!authorization) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authorization.replace('Bearer ', '')
    );

    if (userError) throw userError;

    const { id } = req.params;
    const { title, description, content } = req.body;
    
    const { data, error } = await supabase
      .from('puzzles')
      .update({ title, description, content })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Update puzzle error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a puzzle
router.delete('/:id', async (req, res) => {
  try {
    const { authorization } = req.headers;
    if (!authorization) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authorization.replace('Bearer ', '')
    );

    if (userError) throw userError;

    const { id } = req.params;
    const { error } = await supabase
      .from('puzzles')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    res.status(204).send();
  } catch (error) {
    console.error('Delete puzzle error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 