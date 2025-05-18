-- Enable UUID extension for unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE "Role" AS ENUM ('STUDENT', 'TEACHER', 'ADMIN');
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO', 'PDF');

-- Users table
CREATE TABLE "users" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role "Role" DEFAULT 'STUDENT',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Journals table
CREATE TABLE "journals" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    media TEXT[], -- Array of media URLs
    "mediaType" "MediaType",
    "teacherId" UUID NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tagged Students (Many-to-Many: Journals <-> Users)
CREATE TABLE "_TaggedStudents" (
    "A" UUID REFERENCES "journals"(id) ON DELETE CASCADE,
    "B" UUID REFERENCES "users"(id) ON DELETE CASCADE,
    PRIMARY KEY ("A", "B")
);

-- (Optional) If you need a general JournalToUser relation, uncomment below:
-- CREATE TABLE "_JournalToUser" (
--     "A" UUID REFERENCES "journals"(id) ON DELETE CASCADE,
--     "B" UUID REFERENCES "users"(id) ON DELETE CASCADE,
--     PRIMARY KEY ("A", "B")
-- );

-- Indexes for performance
CREATE INDEX idx_journals_teacher_id ON "journals"("teacherId");
CREATE INDEX idx_taggedstudents_journal_id ON "_TaggedStudents"("A");
CREATE INDEX idx_taggedstudents_user_id ON "_TaggedStudents"("B");

-- Triggers to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON "users"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journals_updated_at
    BEFORE UPDATE ON "journals"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- Add publish_at column with default value of current timestamp
ALTER TABLE journals 
ADD COLUMN publish_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create a trigger function to automatically set publish_at to current timestamp if NULL
CREATE OR REPLACE FUNCTION set_publish_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.publish_at IS NULL THEN
        NEW.publish_at := CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function before insert
CREATE TRIGGER set_publish_at_trigger
    BEFORE INSERT ON journals
    FOR EACH ROW
    EXECUTE FUNCTION set_publish_at();