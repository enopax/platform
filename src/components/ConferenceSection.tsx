import {
  RiErrorWarningFill,
  RiClipboardLine,
  RiCheckboxCircleLine,
  RiShuffleLine,
  RiRefreshLine,
  RiQuestionAnswerLine
} from '@remixicon/react';
import { Callout } from '@/components/common/Callout';
import { Card } from '@/components/common/Card';
import ActivityListItem from '@/components/list/ActivityListItem';

export default async function ConferenceSection() {
  return (
    <>
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-3">Unconference Format</h3>
          <p className="mb-4">
            Our camp follows an <strong>unconference</strong> format, which means the agenda is created collaboratively by all participants. 
            Unlike traditional conferences with pre-planned speakers and topics, an unconference is driven by the collective interests and expertise of attendees.
          </p>
          
          <Callout title="What makes it special" icon={RiErrorWarningFill} className="mb-4">
            Anyone can propose a session, lead a discussion, or share their knowledge. 
            The topics emerge organically based on what the community wants to explore together.
          </Callout>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-3">How Our Timetable Works</h3>
          <p className="mb-4">
            We have dedicated session slots throughout each day - both during daytime and in the evenings. 
            Here's how the magic happens:
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <RiClipboardLine className="size-5 text-gray-600" />
                <h4 className="font-semibold text-lg">Morning Planning</h4>
              </div>
              <p className="text-sm">
                Each day starts with a brief session where participants can propose topics, 
                discussions, workshops, or activities they'd like to lead or attend.
              </p>
            </Card>
            
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <RiCheckboxCircleLine className="size-5 text-gray-600" />
                <h4 className="font-semibold text-lg">Collaborative Scheduling</h4>
              </div>
              <p className="text-sm">
                We collectively decide which sessions happen when, ensuring everyone can 
                participate in what interests them most.
              </p>
            </Card>
            
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <RiShuffleLine className="size-5 text-gray-600" />
                <h4 className="font-semibold text-lg">Flexible Sessions</h4>
              </div>
              <p className="text-sm">
                Sessions can be technical talks, hands-on workshops, group discussions, 
                brainstorming sessions, or even outdoor activities.
              </p>
            </Card>
            
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <RiRefreshLine className="size-5 text-gray-600" />
                <h4 className="font-semibold text-lg">Adaptive Schedule</h4>
              </div>
              <p className="text-sm">
                The schedule can evolve throughout the camp based on emerging interests 
                and spontaneous ideas from the group.
              </p>
            </Card>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-3">What You Can Expect</h3>
          <p className="mb-4">
            Beyond the collaborative sessions, there are plenty of activities held by participants throughout the camp:
          </p>
        </div>
      </div>
      
      <div className="mt-6">
        <ActivityListItem />
      </div>
      
      <Callout title="New to unconferences?" variant="warning" icon={RiQuestionAnswerLine} className="mt-8">
        Don't worry! The beauty of this format is that everyone contributes 
        in their own way. Whether you're sharing expertise, asking questions, or simply participating in discussions, 
        your presence adds value to the community experience.
      </Callout>
    </>
  );
}