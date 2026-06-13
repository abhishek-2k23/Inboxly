CREATE TABLE "gmail_watch_state" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"email_address" text NOT NULL,
	"history_id" text,
	"expiration" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gmail_watch_state_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "gmail_watch_state_email_address_unique" UNIQUE("email_address")
);
--> statement-breakpoint
ALTER TABLE "gmail_watch_state" ADD CONSTRAINT "gmail_watch_state_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;