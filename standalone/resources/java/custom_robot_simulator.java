package frc.robot;

import com.snobot.simulator.ASimulator;
import com.snobot.simulator.robot_container.IRobotClassContainer;
import com.snobot.simulator.robot_container.JavaRobotContainer;

public class CustomRobotSimulator extends ASimulator {

    @Override
    public void setRobot(IRobotClassContainer aRobot) {
        setRobot((Robot) ((JavaRobotContainer) aRobot).getJavaRobot());
    }

    public void setRobot(Robot aRobot) {
        System.out.println("TODO construct your custom simulation components here");
    }

    @Override
    public void update() {
        // TODO update your custom simulation components here
    }

}
